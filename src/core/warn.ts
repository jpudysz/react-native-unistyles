import type { ViewStyle } from 'react-native'

export const maybeWarnAboutMultipleUnistyles = (style: ViewStyle, displayName = 'Unknown') => {
    if (__DEV__ && style && !Array.isArray(style)) {
        // biome-ignore format: I like it better this way
        const unistylesKeys = Object
            .keys(style)
            .filter(key => key.startsWith('unistyles-'))

        if (unistylesKeys.length > 1) {
            console.warn(
                `Unistyles: we detected style object with ${unistylesKeys.length} unistyles styles. This might cause no updates or unpredictable behavior. Please check style prop for "${displayName}" and use array syntax instead of object syntax.`
            )
        }
    }
}
