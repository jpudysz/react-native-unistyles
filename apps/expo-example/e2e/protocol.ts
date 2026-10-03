// Contract between the in-app runner and the host script (e2e/run.ts), keep it free of React Native imports
import { themes, type ThemeName } from '../themes'

export const SCENARIOS = [
    'tour',
    'shared-dynamic-fn',
    'frozen-stack',
    'frozen-flip',
    'suspense',
    'activity',
    'frozen-list',
    'frozen-unmount',
    'scoped',
    'variants-after-flip',
    'mount-after-flip',
    'set-theme-on-mount',
    'update-theme',
    'transition',
    'lists-scroll',
    'os-appearance',
    'random-walk'
] as const

export type ScenarioId = typeof SCENARIOS[number]

// `reps` must be at least 1, otherwise no scenario runs and the result is an empty PASS
export const parseRunInteger = (name: 'reps' | 'seed', value: string | undefined, fallback: number) => {
    const parsed = value === undefined ? fallback : Number(value)

    if (!Number.isInteger(parsed) || (name === 'reps' && parsed < 1)) {
        throw new Error(`Invalid e2e ${name} "${value}", expected ${name === 'reps' ? 'a positive integer' : 'an integer'}`)
    }

    return parsed
}

// The runner blocks at a sync point until the host acts, every other step runs without the host
export type SyncKind = 'READY' | 'CHECKPOINT' | 'TAP' | 'APPEARANCE' | 'FAILURE' | 'RESULT'

export type Sync = {
    seq: number,
    kind: SyncKind,
    detail: string
}

// Marker text: `E2E <kind> <detail> #<seq>`, e.g. `E2E CHECKPOINT 3 dark #12`
export const formatSync = ({ seq, kind, detail }: Sync) => `E2E ${kind}${detail ? ` ${detail}` : ''} #${seq}`

export const parseSync = (text: string): Sync | undefined => {
    const match = /^E2E (READY|CHECKPOINT|TAP|APPEARANCE|FAILURE|RESULT) ?(.*) #(\d+)$/.exec(text)

    return match ? { kind: match[1] as SyncKind, detail: match[2]!, seq: Number(match[3]) } : undefined
}

export const LABELS = {
    beacon: 'E2E BEACON',
    probe: 'E2E PROBE',
    report: 'E2E REPORT'
}

// Plain colors (not themed). The waiting color alternates with the sync parity, so the host screenshots the beacon
// until it shows the next sync and reads the tree only while the runner is blocked there
export const BEACON_COLORS = {
    running: '#00ffff',
    waiting: ['#ff00ff', '#ffff00']
}

export const beaconColor = (sync?: Sync) => sync ? BEACON_COLORS.waiting[sync.seq % 2]! : BEACON_COLORS.running

// Themed squares in the overlay, `animated` paints through useAnimatedTheme (Reanimated), `native-animated` is a
// React Native Animated.View (native driver), which flattens its two unistyles into one style object
export const PROBES = ['background', 'surface', 'primary', 'accent', 'animated', 'native-animated'] as const

export type ProbeName = typeof PROBES[number]

// The expected paint of every probe per theme, straight from the registered themes
export const PROBE_COLORS = Object.fromEntries(
    (Object.keys(themes) as Array<ThemeName>).map(name => {
        const { colors } = themes[name]

        return [name, {
            background: colors.background,
            surface: colors.surface,
            primary: colors.primary,
            accent: colors.accent,
            animated: colors.secondary,
            'native-animated': colors.typography
        }]
    })
) as Record<ThemeName, Record<ProbeName, string>>

export type Failure = {
    scenario: ScenarioId,
    rep: number,
    step: number,
    action: string,
    tag?: number,
    component?: string,
    styleKey?: string,
    prop: string,
    expected: string,
    actual: string
}

export type Report = {
    result: 'PASS' | 'FAIL',
    platform: string,
    scenarios: Array<ScenarioId>,
    reps: number,
    seed: number,
    taps: boolean,
    steps: number,
    checked: number,
    detached: number,
    suspended: number,
    mismatches: number,
    failureCount: number,
    failuresByScenario: Partial<Record<ScenarioId, number>>,
    // First failures only, the report travels through the accessibility tree
    failures: Array<Failure>,
    durationMs: number
}

export const REPORTED_FAILURES = 10

export const formatFailure = ({ scenario, rep, step, action, component, tag, styleKey, prop, expected, actual }: Failure) => {
    const node = tag === undefined ? '' : `${component} #${tag} '${styleKey}' `

    return `${scenario} rep ${rep} step ${step} (${action}): ${node}${prop} expected ${expected} actual ${actual}`
}

// URI encoded, so accessibility text escaping cannot corrupt it
export const formatReport = (report: Report) => `${LABELS.report} ${encodeURIComponent(JSON.stringify(report))}`

export const parseReport = (text: string) => JSON.parse(decodeURIComponent(text.slice(LABELS.report.length + 1))) as Report
