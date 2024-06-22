import type { Color } from '../types'

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

    // named colors
    return [color, 1]
}
