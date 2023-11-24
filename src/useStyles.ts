import { useMemo } from 'react'
import { StyleSheet } from 'react-native'
import { parseStyle, proxifyFunction } from './utils'
import { useUnistyles } from './hooks'
import type { UnistylesBreakpoints } from './global'
import { unistyles } from './core'
import type {
    ExtractVariantNames,
    ReactNativeStyleSheet,
    StyleSheetWithSuperPowers,
    UnistylesTheme
} from './types'

type ParsedStylesheet<ST extends StyleSheetWithSuperPowers> = {
    theme: UnistylesTheme,
    breakpoint: keyof UnistylesBreakpoints,
    styles: ReactNativeStyleSheet<ST>
}

export const useStyles = <ST extends StyleSheetWithSuperPowers>(
    stylesheet?: ST,
    variant?: ExtractVariantNames<typeof stylesheet>
): ParsedStylesheet<ST> => {
    const { theme, layout, plugins } = useUnistyles()

    if (!stylesheet) {
        return {
            theme,
            breakpoint: layout.breakpoint,
            styles: {} as ReactNativeStyleSheet<ST>
        }
    }

    const parsedStyles = useMemo(() => typeof stylesheet === 'function'
        ? stylesheet(theme)
        : stylesheet, [theme, stylesheet, layout])

    const dynamicStyleSheet = useMemo(() => Object
        .entries(parsedStyles)
        .reduce((acc, [key, value]) => {
            if (typeof value === 'function') {
                return {
                    ...acc,
                    [key]: proxifyFunction(key, value,unistyles.registry.plugins, unistyles.runtime, variant)
                }
            }

            return StyleSheet.create({
                ...acc,
                [key]: parseStyle(
                    key,
                    value,
                    unistyles.registry.plugins,
                    unistyles.runtime,
                    variant
                )
            })
        }, {}),
    [layout, parsedStyles, variant, plugins]
    ) as ReactNativeStyleSheet<ST>

    return {
        theme,
        breakpoint: layout.breakpoint,
        styles: dynamicStyleSheet
    }
}
