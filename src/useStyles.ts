import { useMemo } from 'react'
import { StyleSheet } from 'react-native'
import { parseStyle, proxifyFunction } from './utils'
import type { CreateStylesFactory, CustomNamedStyles, ExtractBreakpoints, RemoveKeysWithPrefix } from './types'
import { useUnistyles } from './useUnistyles'
import type { UnistylesTheme } from './types'

export const useStyles = <ST extends CustomNamedStyles<ST>>(stylesheet?: ST | CreateStylesFactory<ST, UnistylesTheme>) => {
    const { theme, breakpoint, screenSize } = useUnistyles()

    if (!stylesheet) {
        return {
            theme,
            breakpoint,
            styles: {} as ExtractBreakpoints<RemoveKeysWithPrefix<ST>>
        }
    }

    const parsedStyles = useMemo(() => typeof stylesheet === 'function'
        ? stylesheet(theme)
        : stylesheet, [theme, stylesheet])

    const dynamicStyleSheet = useMemo(() => Object
        .entries(parsedStyles)
        .reduce((acc, [key, value]) => {
            const style = value as CustomNamedStyles<ST>

            if (typeof value === 'function') {
                return {
                    ...acc,
                    [key]: proxifyFunction(value, breakpoint, screenSize)
                }
            }

            return StyleSheet.create({
                ...acc,
                [key]: parseStyle<ST>(style, breakpoint, screenSize)
            })
        }, {} as ST), [breakpoint, screenSize, parsedStyles])

    return {
        theme,
        breakpoint,
        styles: dynamicStyleSheet as ExtractBreakpoints<RemoveKeysWithPrefix<ST>>
    }
}
