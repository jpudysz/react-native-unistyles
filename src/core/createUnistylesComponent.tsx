import React, { type ComponentProps, type ComponentType } from 'react'
import type { UnistylesTheme } from '../types'

type Mappings<T extends ComponentType<any>> = (theme: UnistylesTheme) => Partial<Omit<ComponentProps<T>, typeof SUPPORTED_STYLE_PROPS[number]>>

const SUPPORTED_STYLE_PROPS = ['style', 'contentContainerStyle'] as const

export const createUnistylesComponent = <T extends ComponentType<any>>(Component: T, _: Mappings<T> = () => ({})) => {
    return (props: ComponentProps<T>) => {
        return <Component {...props} />
    }
}
