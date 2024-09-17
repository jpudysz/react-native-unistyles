import type { NestedCSSProperties } from 'typestyle/lib/types'
import { deepMergeObjects, isDefined, keyInObject } from '../utils'
import { media } from 'typestyle'
import { convertBreakpoint } from './breakpoint'
import { normalizeNumericValue } from './utils'

type Transforms = Array<Record<string, any>>

const normalizeTransform = (key: string, value: any) => {
    if (key.includes('scale')) {
        return value
    }

    if (typeof value === 'number') {
        return normalizeNumericValue(value)
    }

    return value
}

const createTransformValue = (transforms: Transforms) => transforms
    .map(transform => {
        const [key] = Object.keys(transform)

        if (!key) {
            return undefined
        }

        const value = transform[key]

        switch(key) {
            case 'matrix':
            case 'matrix3d':
                return `${key}(${(value as Array<number>).join(',')})`
            default:
                return `${key}(${normalizeTransform(key, value)})`
        }
    })
    .filter(Boolean)
    .join(' ')

export const getTransformStyle = (transforms: Transforms): NestedCSSProperties => {
    const breakpoints = new Set<string>()
    const normalTransforms: Transforms = []

    transforms.forEach(transform => {
        const [property] = Object.keys(transform)

        if (!property) {
            return
        }

        const value = transform[property]

        if (typeof value === 'object' && !Array.isArray(value)) {
            Object.keys(value).forEach(breakpoint => breakpoints.add(breakpoint))

            return
        }

        normalTransforms.push(transform)
    })

    const breakpointTransforms = Array.from(breakpoints).flatMap(breakpoint => {
        const transformsPerBreakpoint = transforms.map(transform => {
            const [property] = Object.keys(transform)

            if (!property) {
                return null
            }

            const value = transform[property]

            if (typeof value === 'object' && !Array.isArray(value)) {
                return keyInObject(value, breakpoint) ? { [property]: value[breakpoint] } : null
            }

            return null
        }).filter(isDefined)

        return media(convertBreakpoint(breakpoint), {
            transform: createTransformValue(transformsPerBreakpoint)
        })
    })

    return deepMergeObjects({
        transform: createTransformValue(normalTransforms)
    }, ...breakpointTransforms)
}
