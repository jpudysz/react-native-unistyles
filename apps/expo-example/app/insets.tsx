// Test only: rt.insets read three ways (a StyleSheet committed to the shadow tree, useUnistyles and UnistylesRuntime)
// against react-native-safe-area-context, which reads the same window insets on its own. The e2e host moves the app into
// a desktop window, where Android 15 draws a caption bar over the top of the app (#1385)
import React, { useRef } from 'react'
import { Text, View } from 'react-native'
import { type EdgeInsets, useSafeAreaInsets } from 'react-native-safe-area-context'
import { StyleSheet, UnistylesRuntime, useUnistyles } from 'react-native-unistyles'
import { Screen, Section } from '../components'
import { useE2EAction } from '../e2e/actions'
import { sleep } from '../e2e/settle'

const EDGES = ['top', 'bottom', 'left', 'right'] as const

type Edge = typeof EDGES[number]
type EdgeValues = Record<Edge, number | undefined>
type ViewRef = React.ComponentRef<typeof View>

const TIMEOUT_MS = 3000
const POLL_MS = 100
// the values have to agree this long, so a check can't pass while the window still changes
const STABLE_MS = 500
// the bars are laid out on the pixel grid
const TOLERANCE = 1

// The values the hooks rendered last, kept outside React state, reading them must not re-render
let hookInsets: EdgeValues | undefined
let safeAreaInsets: EdgeInsets | undefined

const format = (values: EdgeValues | EdgeInsets | undefined) => EDGES.map(edge => `${edge} ${values?.[edge]}`).join(' ')

// Memoized, so only Unistyles and safe-area-context change them after the screen rendered
const HookReadout = React.memo(() => {
    const { rt } = useUnistyles()

    hookInsets = { top: rt.insets.top, bottom: rt.insets.bottom, left: rt.insets.left, right: rt.insets.right }

    return <Text style={styles.readout}>{`useUnistyles ${format(hookInsets)}`}</Text>
})

const SafeAreaReadout = React.memo(() => {
    safeAreaInsets = useSafeAreaInsets()

    return <Text style={styles.readout}>{`safe-area-context ${format(safeAreaInsets)}`}</Text>
})

type BarRefs = React.RefObject<Partial<Record<Edge, ViewRef | null>>>

const Bars = React.memo<{ bars: BarRefs }>(({ bars }) => (
    <View style={styles.bars}>
        {EDGES.map(edge => (
            <View key={edge} ref={view => { bars.current[edge] = view }} collapsable={false} style={styles[edge]} />
        ))}
    </View>
))

// top and bottom bars are as tall as their inset, left and right ones as wide
const measure = (view: ViewRef | null | undefined, edge: Edge) => new Promise<number | undefined>(resolve => {
    if (!view) {
        resolve(undefined)

        return
    }

    view.measure((_x, _y, width, height) => resolve(edge === 'top' || edge === 'bottom' ? height : width))
})

const isClose = (value: number | undefined, expected: number) => value !== undefined && Math.abs(value - expected) <= TOLERANCE

export default function InsetsScreen() {
    const bars = useRef<Partial<Record<Edge, ViewRef | null>>>({})

    const read = async () => {
        const styleSheet = {} as EdgeValues

        for (const edge of EDGES) {
            styleSheet[edge] = await measure(bars.current[edge], edge)
        }

        return { native: { ...UnistylesRuntime.insets }, styleSheet, hook: hookInsets, safeArea: safeAreaInsets }
    }

    // every source of every edge equals safe-area-context, for STABLE_MS
    const expectSafeArea = async () => {
        const deadline = Date.now() + TIMEOUT_MS
        let values = await read()
        let previous: string | undefined
        let agreedSince: number | undefined

        while (Date.now() < deadline) {
            values = await read()

            const key = JSON.stringify(values)
            const isAgreed = values.safeArea !== undefined && EDGES.every(edge => [values.native[edge], values.styleSheet[edge], values.hook?.[edge]]
                .every(value => isClose(value, values.safeArea![edge])))

            agreedSince = isAgreed && key === previous ? agreedSince ?? Date.now() : undefined
            previous = key

            if (agreedSince !== undefined && Date.now() - agreedSince >= STABLE_MS) {
                return undefined
            }

            await sleep(POLL_MS)
        }

        const edge = EDGES.find(edge => [values.native[edge], values.styleSheet[edge], values.hook?.[edge]]
            .some(value => values.safeArea === undefined || !isClose(value, values.safeArea[edge]))) ?? 'top'

        return {
            styleKey: edge,
            prop: `insets.${edge}`,
            expected: `${values.safeArea?.[edge]} (react-native-safe-area-context)`,
            actual: `native ${values.native[edge]} StyleSheet ${values.styleSheet[edge]} useUnistyles ${values.hook?.[edge]}`
        }
    }

    useE2EAction('insets.safe-area', expectSafeArea)

    return (
        <Screen>
            <Section title="Insets" description="rt.insets in a StyleSheet, useUnistyles and natively, against react-native-safe-area-context">
                <HookReadout />
                <SafeAreaReadout />
                <Bars bars={bars} />
            </Section>
        </Screen>
    )
}

const styles = StyleSheet.create((theme, rt) => ({
    readout: {
        fontSize: 13,
        color: theme.colors.muted
    },
    bars: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: theme.gap(1)
    },
    top: {
        width: 8,
        height: rt.insets.top,
        backgroundColor: theme.colors.accent
    },
    bottom: {
        width: 8,
        height: rt.insets.bottom,
        backgroundColor: theme.colors.primary
    },
    left: {
        width: rt.insets.left,
        height: 8,
        backgroundColor: theme.colors.secondary
    },
    right: {
        width: rt.insets.right,
        height: 8,
        backgroundColor: theme.colors.typography
    }
}))
