import React, { type ComponentProps, type ComponentType } from 'react'
import type { UnistylesTheme } from '../types'

type Mappings<T extends ComponentType<any>> = (theme: UnistylesTheme) => Partial<ComponentProps<T>>

export const createUnistylesComponent = <T extends ComponentType<any>>(Component: T, _: Mappings<T> = () => ({})) => {
    return (props: ComponentProps<T>) => {
        return <Component {...props} />
    }
}
