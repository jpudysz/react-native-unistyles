import type { UnistylesPlugin } from 'react-native-unistyles'
import { PixelRatio } from 'react-native'

const REFERENCE_WIDTH = 300
const REFERENCE_HEIGHT = 800

export const autoGuidelinePlugin: UnistylesPlugin = {
    name: 'autoGuideline',
    onParsedStyle: (styleKey, style, runtime) => {
        const pairs = Object
            .entries(style)
            .map(([key, value]) => {
                if (styleKey.includes('unscaled')) {
                    return [key, value]
                }

                const isNumber = typeof value === 'number'

                if (!isNumber || key === 'flex') {
                    return [key, value]
                }

                if (key === 'height') {
                    const percentage = value / REFERENCE_HEIGHT

                    return [
                        key,
                        PixelRatio.roundToNearestPixel(runtime.screen.height * percentage)
                    ]
                }

                const percentage = value / REFERENCE_WIDTH

                return [
                    key,
                    PixelRatio.roundToNearestPixel(runtime.screen.width * percentage)
                ]
            })

        return Object.fromEntries(pairs)
    }
}
