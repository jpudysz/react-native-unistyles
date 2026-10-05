// Test only: calls setTheme from the mount effect, nodes rendered before the flip link after it
import React, { useEffect } from 'react'
import { Text, View } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { StyleSheet, UnistylesRuntime } from 'react-native-unistyles'
import { Screen, Section } from '../components'
import type { ThemeName } from '../themes'

export default function MountThemeScreen() {
    const { theme } = useLocalSearchParams<{ theme?: ThemeName }>()

    useEffect(() => {
        if (theme) {
            UnistylesRuntime.setTheme(theme)
        }
    }, [])

    return (
        <Screen>
            <Section title="Theme set on mount" description={`setTheme('${theme}')`}>
                {[0, 1, 2].map(index => (
                    <View key={index} style={styles.box(index)}>
                        <Text style={styles.text}>{`Box ${index}`}</Text>
                    </View>
                ))}
            </Section>
        </Screen>
    )
}

const styles = StyleSheet.create(theme => ({
    box: (index: number) => ({
        padding: theme.gap(1),
        borderRadius: 8,
        backgroundColor: theme.colors.steps[index]
    }),
    text: {
        color: theme.colors.typography
    }
}))
