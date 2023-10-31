import { useMemo } from 'react'
import { StyleSheet } from 'react-native'
import { parseStyle, proxifyFunction } from './utils'
import type { CreateStylesFactory, CustomNamedStyles, ExtractBreakpoints, RemoveKeysWithPrefix } from './types'
import { useUnistyles } from './useUnistyles'

// todo types
type T = {}
type B = Record<string, number>

export const useStyles = <ST extends CustomNamedStyles<ST, B>>(stylesheet?: ST | CreateStylesFactory<ST, T>) => {
    const { theme, breakpoint, screenSize } = useUnistyles()

    if (!stylesheet) {
        return {
            theme,
            breakpoint,
            styles: {} as ExtractBreakpoints<RemoveKeysWithPrefix<ST, B>, B>
        }
    }

    const parsedStyles = useMemo(() => typeof stylesheet === 'function'
        ? stylesheet(theme!)
        : stylesheet, [theme, stylesheet])

    const dynamicStyleSheet = useMemo(() => Object
        .entries(parsedStyles)
        .reduce((acc, [key, value]) => {
            const style = value as CustomNamedStyles<ST, B>

            if (typeof value === 'function') {
                return {
                    ...acc,
                    [key]: proxifyFunction<B>(value, breakpoint!, screenSize)
                }
            }

            return StyleSheet.create({
                ...acc,
                [key]: parseStyle<ST, B>(style, breakpoint!, screenSize)
            })
        }, {} as ST), [breakpoint, screenSize, parsedStyles])

    return {
        theme,
        breakpoint,
        styles: dynamicStyleSheet as ExtractBreakpoints<RemoveKeysWithPrefix<ST, B>, B>
    }
}
