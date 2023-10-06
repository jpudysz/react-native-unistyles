import { useContext } from 'react'
import type { CreateStylesFactory, CustomNamedStyles, ScreenSize, ExtractBreakpoints, RemoveKeysWithPrefix } from './types'
import { UnistylesContext } from './UnistylesTheme'
import { getBreakpointFromScreenWidth, proxifyFunction, parseStyle, sortAndValidateBreakpoints } from './utils'
import { useDimensions } from './hooks'

export const createUnistyles = <B extends Record<string, number>, T = {}>(breakpoints: B) => {
    const sortedBreakpoints = sortAndValidateBreakpoints(breakpoints)

    return {
        /**
         * @deprecated The method should not be used, proposed version by the community is createStyleSheet, will be removed in RC
         */
        createStyles: <S extends CustomNamedStyles<S, B>, X>(styles: S | CustomNamedStyles<S, B> | X | ((theme: T) => X | CustomNamedStyles<X, B>)): S | X => {
            if (typeof styles === 'function') {
                return styles as X
            }

            return styles as S
        },
        createStyleSheet: <S extends CustomNamedStyles<S, B>, X>(styles: S | CustomNamedStyles<S, B> | X | ((theme: T) => X | CustomNamedStyles<X, B>)): S | X => {
            if (typeof styles === 'function') {
                return styles as X
            }

            return styles as S
        },
        useStyles: <ST extends CustomNamedStyles<ST, B>>(stylesheet?: ST | CreateStylesFactory<ST, T>) => {
            const theme = useContext(UnistylesContext) as T
            const dimensions = useDimensions()
            const breakpoint = getBreakpointFromScreenWidth<B>(dimensions.width, sortedBreakpoints)
            const screenSize: ScreenSize = {
                width: dimensions.width,
                height: dimensions.height
            }

            if (!stylesheet) {
                return {
                    theme,
                    styles: {} as ExtractBreakpoints<RemoveKeysWithPrefix<ST, B>, B>
                }
            }

            const parsedStyles = typeof stylesheet === 'function'
                ? stylesheet(theme)
                : stylesheet

            const dynamicStyleSheet = Object
                .entries(parsedStyles)
                .reduce((acc, [key, value]) => {
                    const x = value as CustomNamedStyles<ST, B>

                    if (typeof value === 'function') {
                        return {
                            ...acc,
                            [key]: proxifyFunction<B>(value, breakpoint, screenSize, sortedBreakpoints)
                        }
                    }

                    return {
                        ...acc,
                        [key]: parseStyle<ST, B>(x, breakpoint, screenSize, sortedBreakpoints)
                    }
                }, {} as ST)

            return {
                theme,
                styles: dynamicStyleSheet as ExtractBreakpoints<RemoveKeysWithPrefix<ST, B>, B>
            }
        }
    }
}
