import { useMemo } from 'react'
import { StyleSheet } from 'react-native'
import { parseStyle, proxifyFunction } from './utils'
import type {
    CreateStylesFactory,
    CustomNamedStyles,
    ExtractVariantNames,
    ReactNativeStyleSheet,
    UnistylesTheme
} from './types'
import { useUnistyles } from './hooks'
import type { UnistylesBreakpoints } from './global'

type ParsedStylesheet<ST extends CustomNamedStyles<ST>> = {
    theme: UnistylesTheme,
    breakpoint: keyof UnistylesBreakpoints,
    styles: ReactNativeStyleSheet<ST>
}

export const useStyles = <ST extends CustomNamedStyles<ST>>(
    stylesheet?: ST | CreateStylesFactory<ST, UnistylesTheme>,
    variant?: ExtractVariantNames<typeof stylesheet> & string
): ParsedStylesheet<ST> => {
    const { theme, layout } = useUnistyles()
    const { screenSize, breakpoint } = layout

    if (!stylesheet) {
        return {
            theme,
            breakpoint,
            styles: {} as ReactNativeStyleSheet<ST>
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
                    [key]: proxifyFunction(value, breakpoint, screenSize, variant)
                }
            }

            return StyleSheet.create({
                ...acc,
                [key]: parseStyle<ST>(style, breakpoint, screenSize, variant)
            })
        }, {} as ST), [breakpoint, screenSize, parsedStyles, variant]) as ReactNativeStyleSheet<ST>

    return {
        theme,
        breakpoint,
        styles: dynamicStyleSheet
    }
}
