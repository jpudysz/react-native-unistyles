import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Animated as RNAnimated, Pressable, ScrollView, Text, View } from 'react-native'
import { usePathname } from 'expo-router'
import { Card } from 'e2e-third-party-card'
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

// A 3rd party component that forwards a unistyle to its React Native View.
// Memoized like the component, so only Unistyles can repaint it
const ThirdPartyProbe = React.memo(() => (
    <Card accessible accessibilityLabel={`${LABELS.probe} third-party`} style={styles.thirdPartyProbe} />
))

// Memoized, so only a Unistyles shadow tree update can repaint the gradients, React keeps what it processed last
const GradientProbes = React.memo(() => (
    <React.Fragment>
        <View accessible accessibilityLabel={`${LABELS.probe} linear-gradient`} style={styles.linearGradientProbe} />
        <View accessible accessibilityLabel={`${LABELS.probe} radial-gradient`} style={styles.radialGradientProbe} />
    </React.Fragment>
))

// Painted with the probe's theme color, the other probes render their own components
const THEMED_PROBES = ['background', 'surface', 'primary', 'accent'] as const

const ScopedView = withUnistyles(View)

// useUnistyles and useAnimatedTheme of a component mounted after its ScopedTheme rendered
const LateScopedHooks = () => {
    const { theme, rt } = useUnistyles()
    const animatedTheme = useAnimatedTheme()

    useE2EAction('scoped-probe.check', () => {
        const expected = themes.dark.colors.primary
        const actual = { useUnistyles: theme.colors.primary, useAnimatedTheme: animatedTheme.value.colors.primary }
        const hook = (Object.keys(actual) as Array<keyof typeof actual>).find(key => actual[key] !== expected)

        if (hook) {
            return { component: hook, prop: 'theme.colors.primary', expected, actual: actual[hook] }
        }

        return rt.themeName !== 'dark'
            ? { component: 'useUnistyles', prop: 'rt.themeName', expected: 'dark', actual: rt.themeName ?? '' }
            : undefined
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
            <View accessible accessibilityLabel={`${LABELS.probe} scoped-theme-name`} style={styles.scopedThemeNameProbe} />
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
                <ThirdPartyProbe />
                <GradientProbes />
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
        width: 24,
        height: 24
    },
    probe: (probe: typeof THEMED_PROBES[number]) => ({
        width: 24,
        height: 24,
        backgroundColor: theme.colors[probe]
    }),
    scopedProbe: {
        width: 24,
        height: 24,
        backgroundColor: theme.colors.primary
    },
    // rt.themeName is the scope too, also when a theme change rebuilds the style outside of render (#1295)
    scopedThemeNameProbe: {
        width: 24,
        height: 24,
        backgroundColor: rt.themeName === 'dark' ? theme.colors.primary : theme.colors.accent
    },
    nativeAnimatedProbe: {
        backgroundColor: theme.colors.typography
    },
    thirdPartyProbe: {
        width: 24,
        height: 24,
        backgroundColor: theme.colors.accent
    },
    // the center is the first color, hard stops paint the second one around it
    // one 15px tile from x = 9 puts the center in the first color, a full size tile at 0 in the second one
    linearGradientProbe: {
        width: 24,
        height: 24,
        experimental_backgroundImage: `linear-gradient(90deg, ${theme.colors.steps[0]} 0% 40%, ${theme.colors.steps[2]} 40%)`,
        backgroundSize: '15px 24px',
        backgroundPosition: '9px 0',
        backgroundRepeat: 'no-repeat'
    },
    // one 16px tile from 8, 8 centers the circle in the probe, a full size tile at 0 moves it to 6, 6
    radialGradientProbe: {
        width: 24,
        height: 24,
        experimental_backgroundImage: `radial-gradient(circle at 25% 25%, ${theme.colors.steps[1]} 0% 20%, ${theme.colors.steps[2]} 20%)`,
        backgroundSize: [{ x: 16, y: 16 }],
        backgroundPosition: [{ top: 8, left: 8 }],
        backgroundRepeat: [{ x: 'no-repeat', y: 'no-repeat' }]
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
