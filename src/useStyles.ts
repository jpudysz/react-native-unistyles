import { useMemo } from 'react'
import { StyleSheet } from 'react-native'
import { parseStyle, proxifyFunction, withPlugins } from './utils'
import { useUnistyles, useVariants } from './hooks'
import type { UnistylesBreakpoints } from './global'
import type { ExtractVariantNames, ReactNativeStyleSheet, StyleSheetWithSuperPowers, UnistylesTheme } from './types'

type ParsedStylesheet<ST extends StyleSheetWithSuperPowers> = {
    theme: UnistylesTheme,
    breakpoint: keyof UnistylesBreakpoints,
    styles: ReactNativeStyleSheet<ST>
}

export const useStyles = <ST extends StyleSheetWithSuperPowers>(
    stylesheet?: ST,
    variantsMap?: ExtractVariantNames<typeof stylesheet>
): ParsedStylesheet<ST> => {
    const { theme, layout, plugins } = useUnistyles()
    const variants = useVariants(variantsMap)
    const parsedStyles = useMemo(() => typeof stylesheet === 'function'
        ? stylesheet(theme)
        : stylesheet, [theme, stylesheet, layout])

    const dynamicStyleSheet = useMemo(() => Object
        .entries(parsedStyles || {})
        .reduce((acc, [key, value]) => {
            if (typeof value === 'function') {
                return {
                    ...acc,
                    [key]: proxifyFunction(key, value)
                }
            }

            return StyleSheet.create({
                ...acc,
                [key]: withPlugins(key, parseStyle(value, variants))
            })
        }, {}), [parsedStyles, variants, plugins]
    )

    return {
        theme,
        breakpoint: layout.breakpoint,
        styles: dynamicStyleSheet as ReactNativeStyleSheet<ST>
    }
}
