import { useContext } from 'react'
import { useWindowDimensions } from 'react-native'
import type { CreateStylesFactory, CustomNamedStyles, ScreenSize, ExtractBreakpoints, RemoveKeysWithPrefix } from './types'
import { UnistylesContext } from './UnistylesTheme'
import { getBreakpointFromScreenWidth, proxifyFunction, parseStyle, sortAndValidateBreakpoints } from './utils'

export const createUnistyles = <B extends Record<string, number>, T = {}>(breakpoints: B) => {
    const sortedBreakpoints = sortAndValidateBreakpoints(breakpoints) as B

    return {
        createStyles: <S extends CustomNamedStyles<S, B>>(styles: S | CreateStylesFactory<S, T>) => styles as S,
        useStyles: <ST extends CustomNamedStyles<ST, B>>(stylesheet?: ST | CreateStylesFactory<ST, T>) => {
            const theme = useContext(UnistylesContext) as T
            const dimensions = useWindowDimensions()
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
