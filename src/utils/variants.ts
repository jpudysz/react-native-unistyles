import type { Optional, NestedStyle } from '../types'

export const getKeyForVariant = (value: NestedStyle, variant?: string): Optional<keyof typeof value> => {
    if (!value.variants) {
        return undefined
    }

    if (variant && variant in value.variants) {
        return variant as keyof typeof value
    }

    if ('default' in value.variants) {
        return 'default' as keyof typeof value
    }

    return undefined
}
