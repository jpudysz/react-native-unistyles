import type { CustomNamedStyles, UnistylesTheme } from './types'

export const createStyleSheet = <S, X>(styles: S | CustomNamedStyles<S> | X | ((theme: UnistylesTheme) => X | CustomNamedStyles<X>)): S | X => {
    if (typeof styles === 'function') {
        return styles as X
    }

    return styles as S
}
