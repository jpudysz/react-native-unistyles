// Content hidden by <Activity> keeps rendering, it must show the current theme and its own arguments when visible again
import React, { Activity, useLayoutEffect, useRef, useState } from 'react'
import { Text, View } from 'react-native'
import { StyleSheet, UnistylesRuntime, useUnistyles } from 'react-native-unistyles'
import { Button, Screen, Section } from '../components'
import { useE2EAction } from '../e2e/actions'
import { themes, type ThemeName } from '../themes'

type Committed = {
    theme?: string
}

// Hidden <Activity> content has its effects cleaned up, the hook must catch up with a theme change made meanwhile (#1297)
const HookTheme: React.FunctionComponent<{ committed: Committed }> = ({ committed }) => {
    const { theme } = useUnistyles()

    useLayoutEffect(() => {
        committed.theme = theme.colors.typography
    })

    return <Text style={{ color: theme.colors.typography }}>{`useUnistyles theme: ${theme.colors.typography}`}</Text>
}

// Memoized, so showing the content again doesn't re-render the hook
const MemoizedHookTheme = React.memo(HookTheme)

const ITEMS = [0, 1, 2, 3]

const Content: React.FunctionComponent<{ step: number }> = ({ step }) => (
    <View style={styles.content}>
        {ITEMS.map(index => (
            <View key={index} style={styles.item(index, step)}>
                <Text style={styles.itemText(step)}>{`Item ${index}, step ${step}`}</Text>
            </View>
        ))}
    </View>
)

export default function ActivityScreen() {
    const [isVisible, setIsVisible] = useState(true)
    const [step, setStep] = useState(0)
    const committed = useRef<Committed>({}).current

    const toggle = () => setIsVisible(current => !current)
    const bump = () => setStep(current => current + 1)

    useE2EAction('activity.toggle', toggle)
    useE2EAction('activity.bump', bump)
    useE2EAction('activity.hook', () => {
        const expected = themes[UnistylesRuntime.themeName as ThemeName].colors.typography

        return committed.theme === expected
            ? undefined
            : { styleKey: 'useUnistyles', prop: 'theme.colors.typography', expected, actual: String(committed.theme) }
    })

    return (
        <Screen>
            <Section title="Activity" description={isVisible ? 'Content is visible' : 'Content is hidden and still renders'}>
                <Activity mode={isVisible ? 'visible' : 'hidden'}>
                    <MemoizedHookTheme committed={committed} />
                    <Content step={step} />
                </Activity>
            </Section>
            <Button title={isVisible ? 'Hide' : 'Show'} onPress={toggle} />
            <Button title="Next step" onPress={bump} />
        </Screen>
    )
}

const styles = StyleSheet.create(theme => ({
    content: {
        gap: theme.gap(1)
    },
    item: (index: number, step: number) => ({
        padding: theme.gap(1.5),
        borderRadius: 8,
        backgroundColor: (index + step) % 2 === 0 ? theme.colors.surface : theme.colors.primary
    }),
    itemText: (step: number) => ({
        color: step % 2 === 0 ? theme.colors.typography : theme.colors.accent
    })
}))
