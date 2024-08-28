import type { StyleSheetWithSuperPowers, StyleSheet } from '../src/types/stylesheet'

export const create = (stylesheet: StyleSheetWithSuperPowers<StyleSheet>) => {
    if (typeof stylesheet === 'function') {
        return {}
    }

    return {}
}
