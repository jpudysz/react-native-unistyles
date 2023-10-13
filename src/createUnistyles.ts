import { useContext, useMemo } from 'react'
import { StyleSheet } from 'react-native'
import type {
    Breakpoints,
    CreateStylesFactory,
    CustomNamedStyles,
    ExtractBreakpoints,
    RemoveKeysWithPrefix,
    SortedBreakpointEntries
} from './types'
import { UnistylesContext } from './UnistylesTheme'
import { useDimensions } from './hooks'
import { getBreakpointFromScreenWidth, proxifyFunction, parseStyle, sortAndValidateBreakpoints } from './utils'

export const createUnistyles = <B extends Breakpoints, T = {}>(breakpoints: B) => {
    const sortedBreakpoints = sortAndValidateBreakpoints(breakpoints)
    const sortedBreakpointEntries = Object
        .entries(sortedBreakpoints) as SortedBreakpointEntries<B>

    return {
        createStyleSheet: <S extends CustomNamedStyles<S, B>, X>(styles: S | CustomNamedStyles<S, B> | X | ((theme: T) => X | CustomNamedStyles<X, B>)): S | X => {
            if (typeof styles === 'function') {
                return styles as X
            }

            return styles as S
        },
        useStyles: <ST extends CustomNamedStyles<ST, B>>(stylesheet?: ST | CreateStylesFactory<ST, T>) => {
            const theme = useContext(UnistylesContext) as T
            const screenSize = useDimensions()

            if (!stylesheet) {
                return {
                    theme,
                    styles: {} as ExtractBreakpoints<RemoveKeysWithPrefix<ST, B>, B>
                }
            }

            const parsedStyles = useMemo(() => typeof stylesheet === 'function'
                ? stylesheet(theme)
                : stylesheet, [theme, stylesheet])

            const breakpoint = getBreakpointFromScreenWidth<B>(screenSize.width, sortedBreakpointEntries)

            const dynamicStyleSheet = useMemo(() => Object
                .entries(parsedStyles)
                .reduce((acc, [key, value]) => {
                    const style = value as CustomNamedStyles<ST, B>

                    if (typeof value === 'function') {
                        return {
                            ...acc,
                            [key]: proxifyFunction<B>(value, breakpoint, screenSize, sortedBreakpointEntries)
                        }
                    }

                    return StyleSheet.create({
                        ...acc,
                        [key]: parseStyle<ST, B>(style, breakpoint, screenSize, sortedBreakpointEntries)
                    })
                }, {} as ST), [breakpoint, screenSize, parsedStyles])

            return {
                theme,
                styles: dynamicStyleSheet as ExtractBreakpoints<RemoveKeysWithPrefix<ST, B>, B>
            }
        }
    }
}
