import type { DropShadowValue } from 'react-native'
import { isUnistylesMq } from '../../../utils'
import type { UnistylesRuntime } from '../../runtime'
import { hyphenate } from '../../utils'
import type { Filters } from '../types'
import { normalizeColor, normalizeNumericValue } from '../utils'
import { getObjectStyle } from './objectStyle'

const getDropShadowStyle = (dropShadow: DropShadowValue) => {
    const { offsetX = 0, offsetY = 0, standardDeviation = 0, color = '#000' } = dropShadow

    return `${normalizeColor(String(color))} ${normalizeNumericValue(offsetX)} ${normalizeNumericValue(offsetY)} ${normalizeNumericValue(standardDeviation)}`
}

export const getFilterStyle = (filters: Array<Filters>, runtime: UnistylesRuntime) => {
    const restFilters = filters.filter(filter => Object.keys(filter)[0] !== 'dropShadow')
    const dropShadow = (() => {
        const dropShadowValue = filters.find(filter => Object.keys(filter)[0] === 'dropShadow')?.dropShadow as Record<string, any>

        if (typeof dropShadowValue !== 'object') {
            return []
        }

        const breakpoints = Object.keys(dropShadowValue).filter(key => Object.keys(runtime.breakpoints).includes(key) || isUnistylesMq(key))
        const breakpointsDropShadow = Object.fromEntries(breakpoints.map(breakpoint => [breakpoint, getDropShadowStyle(dropShadowValue[breakpoint])]))

        if (breakpoints.length === 0) {
            return [{
                dropShadow: getDropShadowStyle(dropShadowValue as DropShadowValue)
            }]
        }

        return [{
            dropShadow: breakpointsDropShadow
        }]
    })()

    return getObjectStyle([...restFilters, ...dropShadow], 'filter', (key, value) => `${hyphenate(key)}(${normalizeNumericValue(value as number | string)})`)
}
