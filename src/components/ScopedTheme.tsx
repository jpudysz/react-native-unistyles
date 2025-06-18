import React from 'react'
import type { UnistylesThemes } from '../global'
import { UnistylesRuntime, UnistylesShadowRegistry } from '../specs'
import { AdaptiveTheme } from './AdaptiveTheme'
import { NamedTheme } from './NamedTheme'

type ThemeProps = {
    name: keyof UnistylesThemes,
    invertedAdaptive?: never
    reset?: never
} | {
    name?: never,
    invertedAdaptive: true,
    reset?: never
} | {
    name?: never,
    invertedAdaptive?: never,
    reset: true
}

export const ScopedTheme: React.FunctionComponent<React.PropsWithChildren<ThemeProps>> = ({
    name,
    children,
    invertedAdaptive,
    reset
}) => {
    const hasAdaptiveThemes = UnistylesRuntime.hasAdaptiveThemes
    const isAdaptiveTheme = invertedAdaptive && hasAdaptiveThemes

    if (!invertedAdaptive && !name && !reset) {
        if (__DEV__) {
            console.error('ScopedTheme: name, reset or invertedAdaptive must be provided')
        }

        return null
    }

    const previousScopedTheme = UnistylesShadowRegistry.getScopedTheme()

    switch (true) {
        case invertedAdaptive && !hasAdaptiveThemes:
            return children
        case isAdaptiveTheme:
            return (
                <AdaptiveTheme previousScopedTheme={previousScopedTheme}>
                    {children}
                </AdaptiveTheme>
            )
        case reset:
            return (
                <NamedTheme
                    name={undefined}
                    previousScopedTheme={previousScopedTheme}
                >
                    {children}
                </NamedTheme>
            )
        case name !== undefined:
            return (
                <NamedTheme
                    name={name as keyof UnistylesThemes}
                    previousScopedTheme={previousScopedTheme}
                >
                    {children}
                </NamedTheme>
            )
        default:
            return null
    }
}
