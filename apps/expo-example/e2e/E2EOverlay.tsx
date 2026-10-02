import React, { useEffect, useSyncExternalStore } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { usePathname } from 'expo-router'
import Animated, { useAnimatedStyle } from 'react-native-reanimated'
import { StyleSheet } from 'react-native-unistyles'
import { useAnimatedTheme } from 'react-native-unistyles/reanimated'
import { beaconColor, formatFailure, formatReport, formatSync, LABELS, PROBES, type ProbeName, type Report } from './protocol'
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
                {PROBES.filter(probe => probe !== 'animated').map(probe => (
                    <View
                        key={probe}
                        accessible
                        accessibilityLabel={`${LABELS.probe} ${probe}`}
                        style={styles.probe(probe)}
                    />
                ))}
                <AnimatedProbe />
                <Text style={styles.status}>{state.sync ? formatSync(state.sync) : state.status}</Text>
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
    probe: (probe: Exclude<ProbeName, 'animated'>) => ({
        width: 28,
        height: 28,
        backgroundColor: theme.colors[probe]
    }),
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
