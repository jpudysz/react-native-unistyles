#!/usr/bin/env bun
/// <reference types="bun" />
import { mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import { parseArgs } from 'node:util'
import { createAndroid } from './host/android'
import { APP_DIR, APP_SCHEME, center, type Device, type Element, type Rect } from './host/device'
import { createIOS } from './host/ios'
import { colorDistance, parseHex, readPng, sampleColor, toHex } from './host/png'
import {
    BEACON_COLORS,
    formatFailure,
    formatSync,
    LABELS,
    parseReport,
    parseSync,
    PROBE_COLORS,
    PROBES,
    type ProbeName,
    type Report,
    SCENARIOS,
    type Sync,
} from './protocol'

const USAGE = 'Usage: bun e2e/run.ts <ios|android> --device <udid|serial> [--scenarios <ids|all>] [--reps <n>] [--seed <n>] [--taps] [--skip-build]'

const POLL_MS = 500
const READY_TIMEOUT_MS = 90_000
// Longest stretch the runner may go without a sync point
const STALL_TIMEOUT_MS = 300_000
const BEACON_TOLERANCE = 60
const ACK_RETRY_MS = 3000
// Keep a small margin for color management and antialiasing
const PROBE_TOLERANCE = 12
// A crash (eg. a use after free in a frozen unmount) ends the run instead of stalling it
const CRASH_CHECK_MS = 5000

type ProbeFailure = {
    checkpoint: string
    probe: ProbeName
    expected: string
    actual: string
    screenshot: string
}

const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: {
        'device': { type: 'string' },
        'scenarios': { type: 'string', default: 'all' },
        'reps': { type: 'string', default: '20' },
        'seed': { type: 'string', default: '1' },
        'taps': { type: 'boolean', default: false },
        'skip-build': { type: 'boolean', default: false },
    },
})
const platform = positionals[0]

if ((platform !== 'ios' && platform !== 'android') || values.device === undefined) {
    console.error(USAGE)
    process.exit(2)
}

const unknownScenario = values.scenarios.split(',').find(id => id !== 'all' && !SCENARIOS.includes(id as never))

if (unknownScenario !== undefined) {
    console.error(`Unknown scenario "${unknownScenario}", expected one of: all, ${SCENARIOS.join(', ')}`)
    process.exit(2)
}

const device: Device = platform === 'ios' ? createIOS(values.device) : createAndroid(values.device)
const outDir = join(APP_DIR, 'e2e-results', new Date().toISOString().replace(/[:.]/g, '-'))
const beaconShot = join(tmpdir(), `unistyles-e2e-beacon-${platform}.png`)
const probeFailures: Array<ProbeFailure> = []
let checkpoints = 0

mkdirSync(outDir, { recursive: true })

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const seconds = (since: number) => `${Math.round((Date.now() - since) / 1000)}s`

const findSync = (elements: Array<Element>) => elements.map(element => parseSync(element.label)).find(sync => sync !== undefined)

const findElement = (elements: Array<Element>, match: (element: Element) => boolean, description: string) => {
    const element = elements.find(match)

    if (!element) {
        throw new Error(`No ${description} on screen`)
    }

    return element
}

const screenshot = (name: string) => {
    const path = join(outDir, `${name}.png`)

    device.screenshot(path)

    return path
}

const readSync = () => {
    const elements = device.describe()

    return { elements, sync: findSync(elements) }
}

// The runner starts blocked at READY, so polling the tree is safe
const waitForReady = async () => {
    const deadline = Date.now() + READY_TIMEOUT_MS

    while (Date.now() < deadline) {
        const { elements, sync } = readSync()

        if (sync?.kind === 'READY') {
            return { elements, sync }
        }

        await sleep(POLL_MS * 2)
    }

    throw new Error('The e2e runner did not start, is the deep link handled?')
}

const acknowledge = (beacon: Rect) => device.tap(center(beacon).x, center(beacon).y)

const showsSync = (color: Array<number>, seq: number) => colorDistance(color, parseHex(BEACON_COLORS.waiting[seq % 2]!)) < BEACON_TOLERANCE

// Polls screenshots until the beacon shows the sync after `previous`, the tree is read only while the runner is blocked.
// A later sync is accepted too: the runner times out syncs the screen never showed (e.g. under a stuck overlay)
const waitForSync = async (beacon: Rect, previous: Sync) => {
    const seq = previous.seq + 1
    const { x, y } = center(beacon)
    const deadline = Date.now() + STALL_TIMEOUT_MS
    let seen = 'nothing'
    let stuckSince: number | undefined
    let crashCheckedAt = Date.now()

    while (Date.now() < deadline) {
        await sleep(POLL_MS)

        if (Date.now() - crashCheckedAt > CRASH_CHECK_MS) {
            crashCheckedAt = Date.now()

            if (!device.isRunning()) {
                throw new Error(`The app crashed before sync #${seq}`)
            }
        }

        device.screenshot(beaconShot)

        const color = sampleColor(readPng(beaconShot), x, y)

        seen = `beacon ${toHex(color)}`

        if (showsSync(color, seq)) {
            // A stale snapshot can show an old beacon color, only the marker in the tree decides
            const { elements, sync } = readSync()

            if (sync !== undefined && sync.seq >= seq) {
                return { elements, sync }
            }

            seen = `marker ${sync ? formatSync(sync) : 'missing'}`
            continue
        }

        // An acknowledging tap can get lost, tap again once the tree confirms the runner still waits for it
        if (previous.kind === 'TAP' || previous.kind === 'APPEARANCE' || !showsSync(color, previous.seq)) {
            stuckSince = undefined
            continue
        }

        stuckSince ??= Date.now()

        if (Date.now() - stuckSince > ACK_RETRY_MS) {
            const { elements, sync } = readSync()

            if (sync !== undefined && sync.seq > seq) {
                return { elements, sync }
            }

            if (sync?.seq === previous.seq) {
                acknowledge(beacon)
            }

            stuckSince = undefined
        }
    }

    throw new Error(`Runner stalled before sync #${seq}, last saw ${seen}`)
}

const checkProbes = (sync: Sync, probes: Record<ProbeName, Rect>) => {
    const [, theme] = sync.detail.split(' ') as [string, string]
    const path = screenshot(`checkpoint-${sync.detail.replace(' ', '-')}`)
    const image = readPng(path)

    checkpoints++

    for (const probe of PROBES) {
        const expected = PROBE_COLORS[theme as keyof typeof PROBE_COLORS]![probe]
        const { x, y } = center(probes[probe])
        const actual = sampleColor(image, x, y)

        if (colorDistance(actual, parseHex(expected)) > PROBE_TOLERANCE) {
            probeFailures.push({ checkpoint: sync.detail, probe, expected, actual: toHex(actual), screenshot: relative(APP_DIR, path) })
        }
    }
}

// Answers sync points until the runner publishes its report
const serve = async (): Promise<Report> => {
    let { elements, sync } = await waitForReady()
    const beacon = findElement(elements, element => element.label === LABELS.beacon, 'beacon').frame
    const probes = Object.fromEntries(
        PROBES.map(probe => [probe, findElement(elements, element => element.label === `${LABELS.probe} ${probe}`, `${probe} probe`).frame]),
    ) as Record<ProbeName, Rect>

    while (true) {
        switch (sync.kind) {
            case 'READY':
                acknowledge(beacon)
                break
            case 'CHECKPOINT':
                checkProbes(sync, probes)
                acknowledge(beacon)
                break
            case 'FAILURE':
                screenshot(`failure-${sync.detail}`)
                acknowledge(beacon)
                break
            case 'TAP': {
                const target = sync.detail
                // Found in the tree of expo-example, so the tap cannot land in another app
                const { x, y } = center(findElement(elements, element => element.id === target, `"${target}" element`).frame)

                device.tap(x, y)
                break
            }
            case 'APPEARANCE':
                device.setAppearance(sync.detail as 'light' | 'dark')
                break
            case 'RESULT':
                screenshot('result')

                return parseReport(findElement(elements, element => element.label.startsWith(LABELS.report), 'report').label)
        }

        const next = await waitForSync(beacon, sync)

        if (next.sync.seq > sync.seq + 1) {
            console.log(`Missed syncs #${sync.seq + 1} to #${next.sync.seq - 1}, the screen did not show them`)
        }

        elements = next.elements
        sync = next.sync
    }
}

const printSummary = (report: Report, startedAt: number) => {
    const passed = report.result === 'PASS' && probeFailures.length === 0

    console.log(`\nE2E ${platform} ${passed ? 'PASS' : 'FAIL'} in ${seconds(startedAt)} (runner ${Math.round(report.durationMs / 1000)}s)`)
    console.log(`scenarios ${values.scenarios}, reps ${report.reps}, seed ${report.seed}, taps ${report.taps ? 'on' : 'off'}`)
    console.log(
        `steps ${report.steps}, nodes checked ${report.checked}, detached ${report.detached}, suspended ${report.suspended}, mismatches ${report.mismatches}`,
    )
    console.log(`probes: ${checkpoints} checkpoints, ${probeFailures.length} failed`)
    Object.entries(report.failuresByScenario).forEach(([scenario, count]) => console.log(`  ${scenario}: ${count} failures`))
    report.failures.forEach(failure => console.log(`  ${formatFailure(failure)}`))

    if (report.failureCount > report.failures.length) {
        console.log(`  ... ${report.failureCount - report.failures.length} more`)
    }

    probeFailures.forEach(failure => {
        console.log(
            `  probe ${failure.probe} at checkpoint ${failure.checkpoint}: expected ${failure.expected} actual ${failure.actual} (${failure.screenshot})`,
        )
    })
    console.log(`artifacts: ${relative(process.cwd(), outDir)}`)

    return passed
}

const main = async () => {
    const startedAt = Date.now()

    if (!values['skip-build']) {
        console.log(`Building ${platform} Release (log: ${relative(process.cwd(), join(outDir, 'build.log'))})`)
        device.build(join(outDir, 'build.log'))
        console.log(`Built in ${seconds(startedAt)}`)
    }

    device.install()

    const params = new URLSearchParams({ scenarios: values.scenarios, reps: values.reps, seed: values.seed, host: '1' })

    if (values.taps) {
        params.set('taps', '1')
    }

    const runStartedAt = Date.now()

    device.launch(`${APP_SCHEME}:///e2e?${params}`)

    try {
        const report = await serve()

        writeFileSync(join(outDir, 'report.json'), JSON.stringify({ platform, report, checkpoints, probeFailures }, null, 4))

        return printSummary(report, runStartedAt)
    } catch (error) {
        screenshot('error')
        writeFileSync(join(outDir, 'report.json'), JSON.stringify({ platform, error: String(error), checkpoints, probeFailures }, null, 4))
        console.error(`\nE2E ${platform} ERROR: ${error instanceof Error ? error.message : error}\nartifacts: ${relative(process.cwd(), outDir)}`)

        return false
    }
}

process.exit(await main() ? 0 : 1)
