import { normalizeNumericValue } from '../utils'

type BackgroundLayerKey = 'backgroundSize' | 'backgroundPosition' | 'backgroundRepeat'
type BackgroundSize = string | { x: string | number; y: string | number }
type BackgroundPosition = Partial<Record<'top' | 'left' | 'right' | 'bottom', string | number>>
type BackgroundRepeat = { x: string; y: string }

const createBackgroundSizeValue = (size: BackgroundSize) => {
    if (typeof size === 'string') {
        return size
    }

    return `${normalizeNumericValue(size.x)} ${normalizeNumericValue(size.y)}`
}

const createBackgroundPositionValue = (position: BackgroundPosition) => {
    const edges = (['left', 'right', 'top', 'bottom'] as const).filter((edge) => position[edge] !== undefined)

    return edges.map((edge) => `${edge} ${normalizeNumericValue(position[edge]!)}`).join(' ')
}

const createBackgroundRepeatValue = (repeat: BackgroundRepeat) => `${repeat.x} ${repeat.y}`

const createBackgroundLayerValue = {
    backgroundSize: createBackgroundSizeValue,
    backgroundPosition: createBackgroundPositionValue,
    backgroundRepeat: createBackgroundRepeatValue,
} as Record<BackgroundLayerKey, (layer: any) => string>

// React Native's processed syntax, one object per background layer
export const getBackgroundLayers = (key: string, layers: Array<unknown>) => ({
    [key]: layers.map(createBackgroundLayerValue[key as BackgroundLayerKey]).join(', '),
})
