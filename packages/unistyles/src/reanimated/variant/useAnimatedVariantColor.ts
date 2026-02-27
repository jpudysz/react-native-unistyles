import { interpolateColor, useDerivedValue, useSharedValue } from 'react-native-reanimated'

import type { ColorKeys } from './types'

import { useUpdateVariantColor } from './useUpdateVariantColor'

export const useAnimatedVariantColor = <T extends Record<string, any>>(style: T, colorKey: ColorKeys<T>) => {
    const secretKey = Object.keys(style).find((key) => key.startsWith('unistyles_'))
    // @ts-ignore this is hidden from TS
    const hasVariants = style[secretKey]?.__stylesheetVariants

    if (!hasVariants || !(colorKey as string).toLowerCase().includes('color')) {
        throw new Error(
            'useAnimatedVariantColor: Style was not created by Unistyles, does not have variants or has no color property',
        )
    }

    const { fromValue, toValue } = useUpdateVariantColor({
        animateCallback: (from, to) => animate(from, to),
        colorKey,
        secretKey,
        style,
    })

    const progress = useSharedValue(1)
    const animate = (from: string, to: string) => {
        'worklet'

        fromValue.set(from)
        toValue.set(to)
    }

    const derivedColor = useDerivedValue(() => {
        return interpolateColor(progress.value, [0, 1], [fromValue.get(), toValue.get()])
    })

    return derivedColor
}
