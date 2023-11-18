import type { UnistylesPlugin } from 'react-native-unistyles'

export const highContrastPlugin: UnistylesPlugin = {
    name: 'highContrast',
    onParsedStyle: (_styleKey, style) => {
        const pairs = Object
            .entries(style)
            .map(([key, value]) => {
                if (typeof value !== 'string') {
                    return [key, value]
                }

                if (!value.match(/^#(?:[0-9a-fA-F]{3}){1,2}$/)) {
                    return [key, value]
                }

                const r = parseInt(value.slice(1, 3), 16)
                const g = parseInt(value.slice(3, 5), 16)
                const b = parseInt(value.slice(5, 7), 16)

                const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255

                if (luminance > 0.8) {
                    return [key, '#000000']
                }

                if (luminance > 0.6) {
                    return [key, '#005500']
                }

                return [key, '#FFFF00']
            })

        return Object.fromEntries(pairs)
    }
}
