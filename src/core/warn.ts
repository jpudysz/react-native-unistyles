import type { ViewProps } from 'react-native'

export const maybeWarnAboutMultipleUnistyles = (props: ViewProps, displayName = 'Unknown') => {
    if (__DEV__ && props.style && typeof props.style === 'object') {
        const unistylesKeys = Object
            .keys(props.style)
            .filter(key => key.startsWith('unistyles-'))

        if (unistylesKeys.length > 1) {
            console.warn(`Unistyles: we detected style object with ${unistylesKeys.length} unistyles styles. This might cause no updates or unpredictable behavior. Please check style prop for "${displayName}" and use array syntax instead of object syntax.`)
        }
    }
}
