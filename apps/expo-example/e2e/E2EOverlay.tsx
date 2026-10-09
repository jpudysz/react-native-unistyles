import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Animated as RNAnimated, Pressable, ScrollView, Text, View } from 'react-native'
import { usePathname } from 'expo-router'
import Animated, { useAnimatedStyle } from 'react-native-reanimated'
import { ScopedTheme, StyleSheet, useUnistyles, withUnistyles } from 'react-native-unistyles'
import { useAnimatedTheme } from 'react-native-unistyles/reanimated'
import { themes } from '../themes'
import { useE2EAction } from './actions'
import { beaconColor, formatFailure, formatReport, formatSync, LABELS, type Report } from './protocol'
import { acknowledge, bindRunner, type RunnerState, runnerStore } from './runner'

const ReportPanel: React.FunctionComponent<{ report: Report }> = ({ report }) => (
    <ScrollView style={[StyleSheet.absoluteFill, styles.panel]} contentContainerStyle={styles.panelContent}>
        <Text style={styles.title}>{`E2E RESULT ${report.result}`}</Text>
        <Text style={styles.line}>
            {`${report.platform} steps ${report.steps} checked ${report.checked} detached ${report.detached} suspended ${report.suspended} mismatches ${report.mismatches} failures ${report.failureCount} in ${Math.round(report.durationMs / 1000)}s`}
        </Text>
        {report.failures.map((failure, index) => <Text key={index} style={styles.line}>{formatFailure(failure)}</Text>)}
        <Text style={styles.json}>{formatReport(report)}</Text>
    </ScrollView>
)

const AnimatedProbe = () => {
    const theme = useAnimatedTheme()
    const animatedStyle = useAnimatedStyle(() => ({
        backgroundColor: theme.value.colors.secondary
    }))

    return (
        <Animated.View
            accessible
            accessibilityLabel={`${LABELS.probe} animated`}
            style={[styles.cell, animatedStyle]}
        />
    )
}

// Animated flattens [cell, nativeAnimatedProbe, transform] into one object, the color comes from the second unistyle.
// Memoized, so the overlay re-rendering at every sync can't repaint it, only Unistyles can
const NativeAnimatedProbe = React.memo(() => {
    const offset = useRef(new RNAnimated.Value(1)).current

    useEffect(() => {
        RNAnimated.timing(offset, { toValue: 0, duration: 100, useNativeDriver: true }).start()
    }, [offset])

    return (
        <RNAnimated.View
            accessible
            accessibilityLabel={`${LABELS.probe} native-animated`}
            style={[styles.cell, styles.nativeAnimatedProbe, { transform: [{ translateX: offset }] }]}
        />
    )
})

// Painted with the probe's theme color, the other probes render their own components
const THEMED_PROBES = ['background', 'surface', 'primary', 'accent'] as const

const ScopedView = withUnistyles(View)

// useUnistyles and useAnimatedTheme of a component mounted after its ScopedTheme rendered
const LateScopedHooks = () => {
    const { theme } = useUnistyles()
    const animatedTheme = useAnimatedTheme()

    useE2EAction('scoped-probe.check', () => {
        const expected = themes.dark.colors.primary
        const actual = { useUnistyles: theme.colors.primary, useAnimatedTheme: animatedTheme.value.colors.primary }
        const hook = (Object.keys(actual) as Array<keyof typeof actual>).find(key => actual[key] !== expected)

        return hook ? { component: hook, prop: 'theme.colors.primary', expected, actual: actual[hook] } : undefined
    })

    return null
}

const ScopedProbeCells = () => {
    const [isMounted, setIsMounted] = useState(false)

    // re-renders by itself, ScopedTheme doesn't
    useEffect(() => setIsMounted(true), [])

    return (
        <React.Fragment>
            <View accessible accessibilityLabel={`${LABELS.probe} scoped-rerender`} style={styles.scopedProbe} />
            {isMounted ? (
                <React.Fragment>
                    <View accessible accessibilityLabel={`${LABELS.probe} scoped-late`} style={styles.scopedProbe} />
                    <ScopedView accessible accessibilityLabel={`${LABELS.probe} scoped-with-unistyles`} style={styles.scopedProbe} />
                    <LateScopedHooks />
                </React.Fragment>
            ) : null}
        </React.Fragment>
    )
}

// Memoized, so the overlay re-rendering at every sync can't render the scope again
const ScopedProbes = React.memo(() => (
    <ScopedTheme name="dark">
        <ScopedProbeCells />
    </ScopedTheme>
))

const RunnerOverlay: React.FunctionComponent<{ state: RunnerState }> = ({ state }) => {
    const pathname = usePathname()

    useEffect(() => {
        bindRunner({ pathname })
    })

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            {state.report ? <ReportPanel report={state.report} /> : null}
            <View style={styles.bar} pointerEvents="box-none">
                <Pressable
                    accessibilityLabel={LABELS.beacon}
                    style={[styles.cell, { backgroundColor: beaconColor(state.sync) }]}
                    onPress={acknowledge}
                />
                {/* Themed probes stay mounted for the whole run, so they go through every flip */}
                {THEMED_PROBES.map(probe => (
                    <View
                        key={probe}
                        accessible
                        accessibilityLabel={`${LABELS.probe} ${probe}`}
                        style={styles.probe(probe)}
                    />
                ))}
                <AnimatedProbe />
                <NativeAnimatedProbe />
                <ScopedProbes />
                {/* One line, so a long sync label can't grow the bar over the elements the host taps (the host reads the label) */}
                <Text numberOfLines={1} style={styles.status}>{state.sync ? formatSync(state.sync) : state.status}</Text>
            </View>
        </View>
    )
}

// Rendered by the root layout, renders and subscribes to nothing else until the e2e route starts a run
export const E2EOverlay = () => {
    const state = useSyncExternalStore(runnerStore.subscribe, runnerStore.getSnapshot)

    return state ? <RunnerOverlay state={state} /> : null
}

const styles = StyleSheet.create((theme, rt) => ({
    bar: {
        position: 'absolute',
        left: 8,
        right: 8,
        bottom: rt.insets.bottom + 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4
    },
    cell: {
        width: 28,
        height: 28
    },
    probe: (probe: typeof THEMED_PROBES[number]) => ({
        width: 28,
        height: 28,
        backgroundColor: theme.colors[probe]
    }),
    scopedProbe: {
        width: 28,
        height: 28,
        backgroundColor: theme.colors.primary
    },
    nativeAnimatedProbe: {
        backgroundColor: theme.colors.typography
    },
    status: {
        flex: 1,
        fontSize: 10,
        color: '#ffffff',
        backgroundColor: '#000000',
        padding: 2
    },
    panel: {
        backgroundColor: '#ffffff'
    },
    panelContent: {
        paddingTop: 80,
        paddingBottom: 120,
        paddingHorizontal: 16,
        gap: 8
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000000'
    },
    line: {
        fontSize: 11,
        color: '#000000'
    },
    json: {
        fontSize: 6,
        color: '#666666'
    }
}))
