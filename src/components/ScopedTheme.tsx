import React from 'react'
import type { UnistylesThemes } from '../global'
import { UnistylesRuntime, UnistylesShadowRegistry } from '../specs'
import { AdaptiveTheme } from './AdaptiveTheme'
import { NamedTheme } from './NamedTheme'

type ThemeProps = {
    name: keyof UnistylesThemes,
    invertedAdaptive?: boolean
} | {
    name?: undefined,
    invertedAdaptive: true
}

export const ScopedTheme: React.FunctionComponent<React.PropsWithChildren<ThemeProps>> = ({
    name,
    children,
    invertedAdaptive
}) => {
    const isAdaptiveTheme = invertedAdaptive && UnistylesRuntime.hasAdaptiveThemes

    if (!isAdaptiveTheme && !name) {
        if (__DEV__) {
            console.error('ScopedTheme: name or invertedAdaptive must be provided')
        }

        return null
    }

    const previousScopedTheme = UnistylesShadowRegistry.getScopedTheme()

    return isAdaptiveTheme
        ? (
            <AdaptiveTheme previousScopedTheme={previousScopedTheme}>
                {children}
            </AdaptiveTheme>
        )
        : (
            <NamedTheme
                name={name as keyof UnistylesThemes}
                previousScopedTheme={previousScopedTheme}
            >
                {children}
            </NamedTheme>
        )

}
