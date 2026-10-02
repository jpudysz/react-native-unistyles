import React, { useState } from 'react'
import { ActivityIndicator, Text, View } from 'react-native'
import { Pressable as GesturePressable } from 'react-native-gesture-handler'
import { StyleSheet, useUnistyles, withUnistyles } from 'react-native-unistyles'
import { Screen, Section } from '../components'
import { useE2EAction } from '../e2e/actions'

const UniGesturePressable = withUnistyles(GesturePressable)
const UniActivityIndicator = withUnistyles(ActivityIndicator, theme => ({
    color: theme.colors.accent
}))

const HookDriven: React.FunctionComponent<{ isActive: boolean }> = ({ isActive }) => {
    const { theme, rt } = useUnistyles()

    return (
        <View style={styles.hook(isActive)}>
            <Text style={{ color: theme.colors.typography }}>
                {`useUnistyles: ${rt.themeName}, accent ${theme.colors.accent}`}
            </Text>
        </View>
    )
}

export default function WithUnistylesScreen() {
    const [isActive, setIsActive] = useState(false)

    useE2EAction('with-unistyles.toggle', () => setIsActive(value => !value))

    return (
        <Screen>
            <Section title="withUnistyles" description="Gesture handler Pressable and ActivityIndicator with mapped props">
                <UniGesturePressable style={styles.gesturePressable(isActive)} onPress={() => setIsActive(value => !value)}>
                    <Text style={styles.text}>Gesture handler Pressable</Text>
                </UniGesturePressable>
                <UniActivityIndicator animating={false} hidesWhenStopped={false} />
            </Section>
            <Section title="useUnistyles" description="Inline styles from the hook, re-rendered on theme change">
                <HookDriven isActive={isActive} />
            </Section>
        </Screen>
    )
}

const styles = StyleSheet.create(theme => ({
    gesturePressable: (isActive: boolean) => ({
        padding: theme.gap(1.5),
        borderRadius: 8,
        backgroundColor: isActive ? theme.colors.accent : theme.colors.primary
    }),
    text: {
        color: theme.colors.chip.onFill
    },
    hook: (isActive: boolean) => ({
        padding: theme.gap(1.5),
        borderRadius: 8,
        borderWidth: 2,
        borderColor: isActive ? theme.colors.accent : theme.colors.border
    })
}))
