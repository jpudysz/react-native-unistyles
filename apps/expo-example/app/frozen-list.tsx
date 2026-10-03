// Test only, #1252: a big screen restored from a frozen stack must not block the JS thread
import React from 'react'
import { Text, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { Screen, Section } from '../components'
import { useE2EAction } from '../e2e/actions'

const ROWS = Array.from({ length: 300 }, (_, index) => index)
// one commit per restored node took seconds for this list (quadratic), the whole restore stays far below this
const MAX_STALL_MS = 300
const PROBE_INTERVAL_MS = 5

let stopProbe: (() => number) | undefined

// the longest gap between interval ticks is the longest the JS thread was blocked
const startProbe = () => {
    stopProbe?.()

    let previous = performance.now()
    let longestStall = 0
    const id = setInterval(() => {
        const now = performance.now()

        longestStall = Math.max(longestStall, now - previous)
        previous = now
    }, PROBE_INTERVAL_MS)

    stopProbe = () => {
        clearInterval(id)
        stopProbe = undefined

        return Math.max(longestStall, performance.now() - previous)
    }
}

export default function FrozenListScreen() {
    useE2EAction('frozen-list.watch', startProbe)
    useE2EAction('frozen-list.stall', () => {
        const longestStall = Math.round(stopProbe?.() ?? 0)

        return longestStall <= MAX_STALL_MS
            ? undefined
            : { styleKey: 'stall', prop: 'js stall ms', expected: `<= ${MAX_STALL_MS}`, actual: String(longestStall) }
    })

    return (
        <Screen>
            <Section title="Frozen list" description={`${ROWS.length} rows, ${ROWS.length * 3} styled views, restored after a frozen stack`}>
                {ROWS.map(index => (
                    <View key={index} style={styles.row(index)}>
                        <View style={styles.dot} />
                        <Text style={styles.label}>{`Row ${index}`}</Text>
                    </View>
                ))}
            </Section>
        </Screen>
    )
}

const styles = StyleSheet.create(theme => ({
    row: (index: number) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.gap(1),
        padding: theme.gap(1),
        borderRadius: 8,
        backgroundColor: index % 2 === 0 ? theme.colors.background : theme.colors.chip.subtle
    }),
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: theme.colors.primary
    },
    label: {
        color: theme.colors.typography
    }
}))
