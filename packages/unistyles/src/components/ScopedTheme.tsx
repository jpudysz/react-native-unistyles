import React, { useContext } from 'react'

import type { UnistylesThemes } from '../global'

import { useUnistyles } from '../core'
import { AdaptiveTheme } from './AdaptiveTheme'
import { NamedTheme } from './NamedTheme'
import { ScopedThemeContext } from './ScopedThemeContext'

type ThemeProps =
    | {
          name: keyof UnistylesThemes
          invertedAdaptive?: never
          reset?: never
      }
    | {
          name?: never
          invertedAdaptive: boolean
          reset?: never
      }
    | {
          name?: never
          invertedAdaptive?: never
          reset: boolean
      }

interface InvertedAdaptiveThemeProps extends React.PropsWithChildren {
    previousScopedTheme?: string
}

const InvertedAdaptiveTheme: React.FunctionComponent<InvertedAdaptiveThemeProps> = ({
    children,
    previousScopedTheme,
}) => {
    const { rt } = useUnistyles()

    if (!rt.hasAdaptiveThemes) {
        return children
    }

    return <AdaptiveTheme previousScopedTheme={previousScopedTheme}>{children}</AdaptiveTheme>
}

export const ScopedTheme: React.FunctionComponent<React.PropsWithChildren<ThemeProps>> = ({
    name,
    children,
    invertedAdaptive,
    reset,
}) => {
    const previousScopedTheme = useContext(ScopedThemeContext)?.name

    switch (true) {
        case name !== undefined:
            return (
                <NamedTheme name={name as keyof UnistylesThemes} previousScopedTheme={previousScopedTheme}>
                    {children}
                </NamedTheme>
            )
        case invertedAdaptive:
            return <InvertedAdaptiveTheme previousScopedTheme={previousScopedTheme}>{children}</InvertedAdaptiveTheme>
        case reset:
            return (
                <NamedTheme name={undefined} previousScopedTheme={previousScopedTheme}>
                    {children}
                </NamedTheme>
            )
        default:
            return children
    }
}
