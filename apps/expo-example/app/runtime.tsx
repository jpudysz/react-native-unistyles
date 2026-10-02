import React from 'react'
import { Text, View } from 'react-native'
import { StyleSheet, UnistylesRuntime } from 'react-native-unistyles'
import { Button, restoreThemes, Screen, Section, shuffleAccent } from '../components'
import { useE2EAction } from '../e2e/actions'

export default function RuntimeScreen() {
    useE2EAction('runtime.shuffle', shuffleAccent)
    useE2EAction('runtime.restore', restoreThemes)

    return (
        <Screen>
            <Section title="Mini runtime in styles" description="Insets, font scale and pixel ratio">
                <View style={styles.insets}>
                    <Text style={styles.text}>{`insets ${JSON.stringify(UnistylesRuntime.insets)}`}</Text>
                </View>
                <Text style={styles.scaled}>Font scale driven text</Text>
            </Section>
            <Section title="updateTheme" description="Changes the accent of the current theme">
                <View style={styles.accent} />
                <Button title="Shuffle accent" onPress={shuffleAccent} />
                <Button title="Restore themes" onPress={restoreThemes} />
            </Section>
        </Screen>
    )
}

const styles = StyleSheet.create((theme, rt) => ({
    insets: {
        paddingLeft: rt.insets.left + theme.gap(1),
        paddingVertical: theme.gap(1),
        borderRadius: 8,
        backgroundColor: rt.colorScheme === 'dark' ? theme.colors.chip.subtle : theme.colors.background
    },
    text: {
        fontSize: 12,
        color: theme.colors.typography
    },
    scaled: {
        fontSize: 14 * Math.min(rt.fontScale, 2),
        color: rt.pixelRatio > 2 ? theme.colors.primary : theme.colors.secondary
    },
    accent: {
        height: 48,
        borderRadius: 8,
        backgroundColor: theme.colors.accent
    }
}))
