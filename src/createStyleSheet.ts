import type { CustomNamedStyles } from './types'

// todo
type T = {}
type B = Record<string, number>

export const createStyleSheet = <S extends CustomNamedStyles<S, B>, X>(styles: S | CustomNamedStyles<S, B> | X | ((theme: T) => X | CustomNamedStyles<X, B>)): S | X => {
    if (typeof styles === 'function') {
        return styles as X
    }

    return styles as S
}
