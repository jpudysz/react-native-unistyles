import { type Href, router } from 'expo-router'
import { Platform } from 'react-native'
import { UnistylesRuntime } from 'react-native-unistyles'
import { verify, type VerifyReport } from 'react-native-unistyles/diagnostics'
import { restoreThemes, selectTheme, session } from '../components'
import type { ThemeName } from '../themes'
import { runAction } from './actions'
import { type Failure, type Report, REPORTED_FAILURES, type ScenarioId, type Sync, type SyncKind } from './protocol'
import { type Actions, scenarios, TAP_SCENARIOS } from './scenarios'
import { scrollTarget } from './scroll'
import { settle, sleep } from './settle'

export type RunConfig = {
    scenarios: Array<ScenarioId>,
    reps: number,
    seed: number,
    // Theme pills and back button are tapped by the host instead of called from JS
    taps: boolean,
    // A host script is attached and acknowledges sync points
    host: boolean
}

export type RunnerState = {
    status: string,
    sync?: Sync,
    report?: Report
}

// Returned by a check registered with useE2EAction, for state verify() doesn't cover (props React owns)
type ExpectationFailure = Pick<Failure, 'prop' | 'expected' | 'actual'> & Partial<Failure>

type Bindings = {
    pathname: string
}

const HOST_TIMEOUT_MS = 60_000
// Failure screenshots are best effort
const FAILURE_HOLD_MS = 10_000
const BIND_TIMEOUT_MS = 3000
const ARRIVAL_TIMEOUT_MS = 3000
// Native stack animations are not observable from JS, the popped screen unmounts after its animation
const NAVIGATION_MS = 700
const FAILURE_SCREENSHOTS = 3

let state: RunnerState | undefined
let bindings: Bindings | undefined
let acknowledged = false
let running = false
const listeners = new Set<() => void>()

export const runnerStore = {
    subscribe: (listener: () => void) => {
        listeners.add(listener)

        return () => {
            listeners.delete(listener)
        }
    },
    getSnapshot: () => state
}

const publish = (next: Partial<RunnerState>) => {
    state = { status: '', ...state, ...next }
    listeners.forEach(listener => listener())
}

// Kept current by the overlay, which renders outside the navigator and is never frozen
export const bindRunner = (next: Bindings) => {
    bindings = next
}

export const acknowledge = () => {
    acknowledged = true
}

const waitUntil = async (condition: () => boolean, timeoutMs: number) => {
    const deadline = Date.now() + timeoutMs

    while (!condition()) {
        if (Date.now() > deadline) {
            return false
        }

        await sleep(50)
    }

    return true
}

// Seeded so a failing random walk can be replayed
const createRandom = (seed: number) => {
    let value = seed

    return () => {
        value = (value + 0x6d2b79f5) | 0

        let t = Math.imul(value ^ (value >>> 15), 1 | value)

        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t

        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

class E2ERun implements Actions {
    private seq = 0
    private checkpoints = 0
    private failureSyncs = 0
    private position = { scenario: 'tour' as ScenarioId, rep: 0, step: 0, action: '' }
    random = Math.random
    readonly report: Report

    constructor(private readonly config: RunConfig) {
        this.report = {
            result: 'PASS',
            platform: Platform.OS,
            scenarios: config.scenarios,
            reps: config.reps,
            seed: config.seed,
            taps: config.taps,
            steps: 0,
            checked: 0,
            detached: 0,
            suspended: 0,
            mismatches: 0,
            failureCount: 0,
            failuresByScenario: {},
            failures: [],
            durationMs: 0
        }
    }

    private get taps() {
        return this.config.taps && TAP_SCENARIOS.includes(this.position.scenario)
    }

    get pathname() {
        return bindings!.pathname
    }

    get hasHost() {
        return this.config.host
    }

    async run() {
        const startedAt = Date.now()

        if (!await waitUntil(() => bindings !== undefined, BIND_TIMEOUT_MS)) {
            throw new Error('The e2e overlay is not mounted')
        }

        await this.hold('READY')

        for (const scenario of this.config.scenarios) {
            for (let rep = 1; rep <= this.config.reps; rep++) {
                this.position = { scenario, rep, step: 0, action: '' }
                this.random = createRandom(this.config.seed + rep)
                publish({ status: `E2E RUNNING ${scenario} ${rep}/${this.config.reps}` })

                try {
                    await this.reset()
                    await scenarios[scenario](this)
                } catch (error) {
                    this.fail({ prop: 'error', expected: '', actual: error instanceof Error ? error.message : String(error) })
                }
            }
        }

        await this.goHome()
        this.report.durationMs = Date.now() - startedAt
        this.report.result = this.report.failureCount === 0 ? 'PASS' : 'FAIL'
        publish({ report: this.report, sync: { seq: this.seq++, kind: 'RESULT', detail: this.report.result } })
    }

    theme = () => UnistylesRuntime.themeName as ThemeName

    flip = (theme: ThemeName) =>
        this.step(`flip ${theme}`, async () => {
            if (this.theme() === theme && !UnistylesRuntime.hasAdaptiveThemes) {
                throw new Error(`Flip to the current theme ${theme}`)
            }

            if (this.taps) {
                await this.tap(`theme-${theme}`, () => this.theme() === theme && !UnistylesRuntime.hasAdaptiveThemes)
            } else {
                selectTheme(theme)
            }
        })

    followSystem = () =>
        this.step('follow system', async () => {
            if (this.taps) {
                await this.tap('theme-system', () => UnistylesRuntime.hasAdaptiveThemes)
            } else {
                selectTheme('system')
            }
        })

    appearance = (scheme: 'light' | 'dark') =>
        this.step(`appearance ${scheme}`, async () => {
            if (!UnistylesRuntime.hasAdaptiveThemes || this.theme() === scheme) {
                throw new Error(`Appearance ${scheme} would not flip the theme`)
            }

            if (!await this.sync('APPEARANCE', scheme, () => this.theme() === scheme)) {
                throw new Error(`Appearance ${scheme} did not reach the app`)
            }
        })

    back = () =>
        this.step('back', async () => {
            const from = this.pathname

            if (this.taps) {
                await this.tap('header-back', () => this.pathname !== from)
            } else {
                router.back()
            }

            await this.arrive(() => this.pathname !== from, `back from ${from}`)
        })

    push = (href: string) =>
        this.step(`push ${href}`, () => {
            const pathname = href.split('?')[0]

            router.push(href as Href)

            return this.arrive(() => this.pathname === pathname, href)
        })

    act = (name: string, argument?: number | string) =>
        this.step(`${name}${argument === undefined ? '' : ` ${argument}`}`, () => runAction(name, argument))

    scroll = (target: string, y: number) => this.step(`scroll ${target} ${y}`, () => scrollTarget(target, y))

    expect = (name: string) =>
        this.step(`expect ${name}`, async () => {
            const failure = await runAction(name) as ExpectationFailure | undefined

            if (failure) {
                this.fail(failure)
            }
        })

    // Frozen screens unmounted without unlink are dropped by the sweep of every theme change
    expectNoOrphans = () => {
        const { orphans } = verify()

        if (orphans > 0) {
            this.fail({ action: 'orphans', prop: 'orphans', expected: '0', actual: String(orphans) })
        }
    }

    checkpoint = async () => {
        this.checkpoints++
        await this.hold('CHECKPOINT', `${this.checkpoints} ${this.theme()}`)
    }

    private async goHome() {
        // nested stacks (the session) are dismissed first
        for (let attempt = 0; attempt < 3 && router.canGoBack(); attempt++) {
            router.dismissAll()
            await sleep(NAVIGATION_MS)
        }

        // A cold deep link starts the stack at /e2e
        if (this.pathname !== '/') {
            router.replace('/')
            await this.arrive(() => this.pathname === '/', '/')
        }
    }

    // Programmatic, a reset is not under test
    private async reset() {
        await this.goHome()

        if (!session.isLoggedIn()) {
            await this.step('reset session', session.logIn)
        }

        await this.step('reset themes', restoreThemes)

        if (this.theme() !== 'light' || UnistylesRuntime.hasAdaptiveThemes) {
            await this.step('reset theme', () => selectTheme('light'))
        }
    }

    private async arrive(condition: () => boolean, destination: string) {
        if (!await waitUntil(condition, ARRIVAL_TIMEOUT_MS)) {
            throw new Error(`Navigation did not reach ${destination}`)
        }

        await sleep(NAVIGATION_MS)
    }

    private async step(action: string, act: () => unknown) {
        const failuresBefore = this.report.failureCount

        this.position.step++
        this.position.action = action
        await act()
        await settle()
        this.record(verify())
        await this.clearSync()

        if (this.report.failureCount > failuresBefore && this.failureSyncs < FAILURE_SCREENSHOTS) {
            this.failureSyncs++
            await this.hold('FAILURE', String(this.report.failureCount), FAILURE_HOLD_MS)
        }
    }

    private record(result: VerifyReport) {
        this.report.steps++
        this.report.checked += result.checked
        this.report.detached += result.detached
        this.report.suspended += result.suspended
        this.report.mismatches += result.mismatches.length
        result.mismatches.forEach(mismatch => this.fail(mismatch))
        result.errors.forEach(error => this.fail({ prop: 'verify', expected: 'no error', actual: error }))

        // every update is committed right after it was queued
        if (result.pendingUpdates > 0) {
            this.fail({ prop: 'pendingUpdates', expected: '0', actual: String(result.pendingUpdates) })
        }
    }

    private fail(details: Pick<Failure, 'prop' | 'expected' | 'actual'> & Partial<Failure>) {
        this.report.failureCount++
        this.report.failuresByScenario[this.position.scenario] = (this.report.failuresByScenario[this.position.scenario] ?? 0) + 1

        if (this.report.failures.length < REPORTED_FAILURES) {
            this.report.failures.push({ ...this.position, ...details })
        }
    }

    // Blocks until the host acknowledges (or performs the requested tap), a no-op without a host
    private async sync(kind: SyncKind, detail = '', isDone = () => acknowledged, timeoutMs = HOST_TIMEOUT_MS) {
        if (!this.config.host) {
            return true
        }

        acknowledged = false
        publish({ sync: { seq: this.seq++, kind, detail } })

        return waitUntil(isDone, timeoutMs)
    }

    // Holds still until the host acknowledges, e.g. after screenshotting the probes
    private async hold(kind: SyncKind, detail = '', timeoutMs = HOST_TIMEOUT_MS) {
        if (!await this.sync(kind, detail, undefined, timeoutMs)) {
            this.fail({ action: kind.toLowerCase(), prop: 'host', expected: 'acknowledged', actual: 'timeout' })
        }

        await this.clearSync()
    }

    private async clearSync() {
        if (state?.sync) {
            publish({ sync: undefined })
            await settle()
        }
    }

    private async tap(target: string, isDone: () => boolean) {
        if (!await this.sync('TAP', target, isDone)) {
            throw new Error(`Tap on ${target} had no effect`)
        }
    }
}

export const startRun = async (config: RunConfig) => {
    if (running) {
        return
    }

    running = true
    publish({ status: 'E2E STARTING', sync: undefined, report: undefined })

    try {
        await new E2ERun(config).run()
    } finally {
        running = false
    }
}

