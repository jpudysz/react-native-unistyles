import type { Optional, NestedStyle } from '../types'

export const getKeyForVariant = (value: NestedStyle, variant?: string): Optional<string> => {
    if (variant && variant in value) {
        return variant
    }

    if ('default' in value) {
        return 'default'
    }

    return undefined
}
