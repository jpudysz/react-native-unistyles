import React, { useState } from 'react'
import { Text, View } from 'react-native'
import { ScopedTheme, StyleSheet } from 'react-native-unistyles'
import { Button, Screen, Section } from '../components'
import { useE2EAction } from '../e2e/actions'

const Card: React.FunctionComponent<{ label: string }> = ({ label }) => (
    <View style={styles.card}>
        <Text style={styles.text}>{label}</Text>
        <View style={styles.swatch(label.length)} />
    </View>
)

export default function ScopedThemeScreen() {
    const [isMounted, setIsMounted] = useState(false)

    useE2EAction('scoped.mount', () => setIsMounted(value => !value))

    return (
        <Screen>
            <Section title="Global theme">
                <Card label="Follows the app" />
            </Section>
            <Section title="Named scopes">
                <ScopedTheme name="dark">
                    <Card label="Always dark" />
                    <ScopedTheme name="premium">
                        <Card label="Nested premium" />
                    </ScopedTheme>
                    <ScopedTheme reset>
                        <Card label="Reset to the app" />
                    </ScopedTheme>
                </ScopedTheme>
            </Section>
            <Section title="Inverted adaptive" description="Inverts the system theme while adaptive themes are on">
                <ScopedTheme invertedAdaptive>
                    <Card label="Inverted" />
                </ScopedTheme>
            </Section>
            <Section title="Mounted later">
                <Button title={isMounted ? 'Unmount scope' : 'Mount scope'} onPress={() => setIsMounted(value => !value)} />
                {isMounted ? (
                    <ScopedTheme name="light">
                        <Card label="Late light" />
                    </ScopedTheme>
                ) : null}
            </Section>
        </Screen>
    )
}

const styles = StyleSheet.create(theme => ({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.gap(1.5),
        borderRadius: 8,
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.border
    },
    text: {
        color: theme.colors.typography
    },
    swatch: (size: number) => ({
        width: 12 + size,
        height: 24,
        borderRadius: 4,
        backgroundColor: theme.colors.accent
    })
}))
