import type { Color } from '../types'
import { isIOS } from '../common'

const parseAlpha = (alpha: number) => {
    if (alpha > 1 || alpha < 0) {
        return 1
    }

    return alpha
}

export const parseColor = (color?: Color, alpha: number = 1): [string, number] => {
    if (!color) {
        return ['', 1]
    }

    // ignore alpha for 8 digit hex colors
    if (color.startsWith('#') && color.length === 9) {
        return [color, 1]
    }

    if (color.startsWith('#') && color.length === 7) {
        return [color, parseAlpha(alpha)]
    }

    if (isIOS && color === 'transparent') {
        return ['#000000', 0]
    }

    // todo remove this with Unistyles 3.0
    // named colors
    return [color, 1]
}
