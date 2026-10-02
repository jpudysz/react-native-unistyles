import React from 'react'
import { Pressable, Text, View } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { StyleSheet, UnistylesRuntime, useUnistyles } from 'react-native-unistyles'
import { THEME_NAMES, type ThemeName } from '../themes'

export type ThemeOption = ThemeName | 'system'

export const THEME_OPTIONS: Array<ThemeOption> = [...THEME_NAMES, 'system']

// Shared with the e2e runner, so a scripted flip does the same work as a tap
export const selectTheme = (option: ThemeOption) => {
    if (option === 'system') {
        UnistylesRuntime.setAdaptiveThemes(true)

        return
    }

    if (UnistylesRuntime.hasAdaptiveThemes) {
        UnistylesRuntime.setAdaptiveThemes(false)
    }

    UnistylesRuntime.setTheme(option)
}

type HeaderProps = {
    title: string,
    canGoBack: boolean
}

export const Header: React.FunctionComponent<HeaderProps> = ({ title, canGoBack }) => {
    const insets = useSafeAreaInsets()
    // re-renders the header after every theme change, with new arguments for the shared dynamic functions
    const { rt } = useUnistyles()
    const selected: ThemeOption = rt.hasAdaptiveThemes ? 'system' : rt.themeName as ThemeName

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.row}>
                {canGoBack ? (
                    <Pressable testID="header-back" accessibilityRole="button" onPress={() => router.back()} style={styles.back}>
                        <Text style={styles.backText}>{'‹ Back'}</Text>
                    </Pressable>
                ) : null}
                <Text style={styles.title} numberOfLines={1}>{title}</Text>
            </View>
            <View style={styles.row}>
                {THEME_OPTIONS.map(option => (
                    <Pressable
                        key={option}
                        testID={`theme-${option}`}
                        accessibilityRole="button"
                        onPress={() => selectTheme(option)}
                        style={styles.pill(option === selected)}
                    >
                        <Text style={styles.pillText(option === selected)}>{option}</Text>
                    </Pressable>
                ))}
            </View>
        </View>
    )
}

const styles = StyleSheet.create(theme => ({
    container: {
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        paddingHorizontal: theme.gap(2),
        paddingBottom: theme.gap(1),
        gap: theme.gap(1)
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.gap(1)
    },
    back: {
        paddingVertical: theme.gap(0.5)
    },
    backText: {
        color: theme.colors.primary,
        fontSize: 16
    },
    title: {
        flex: 1,
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.typography
    },
    pill: (isSelected: boolean) => ({
        paddingHorizontal: theme.gap(1.5),
        paddingVertical: theme.gap(0.5),
        borderRadius: 12,
        backgroundColor: isSelected ? theme.colors.chip.fill : theme.colors.chip.subtle
    }),
    pillText: (isSelected: boolean) => ({
        fontSize: 13,
        color: isSelected ? theme.colors.chip.onFill : theme.colors.chip.onSubtle
    })
}))
