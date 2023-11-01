import type { CustomNamedStyles } from './types'
import type { UnistylesThemes } from './global'

type T = UnistylesThemes[keyof UnistylesThemes]

export const createStyleSheet = <S extends CustomNamedStyles<S>, X>(styles: S | CustomNamedStyles<S> | X | ((theme: T) => X | CustomNamedStyles<X>)): S | X => {
    if (typeof styles === 'function') {
        return styles as X
    }

    return styles as S
}
