import React, { type ComponentType, forwardRef, type ComponentProps, type ComponentRef } from 'react'
import type { PartialBy } from '../../types/common'
import { deepMergeObjects } from '../../utils'
import type { Mappings, SupportedStyleProps } from './types'
import type { UnistylesValues } from '../../types'
import { getClassName } from '../getClassname'
import { maybeWarnAboutMultipleUnistyles } from '../warn'
import { useProxifiedUnistyles } from '../useProxifiedUnistyles'

// @ts-expect-error
type GenericComponentProps<T> = ComponentProps<T>
// @ts-expect-error
type GenericComponentRef<T> = ComponentRef<T>

export const withUnistyles = <TComponent, TMappings extends GenericComponentProps<TComponent>>(Component: TComponent, mappings?: Mappings<TMappings>) => {
    type TProps = GenericComponentProps<TComponent>
    type PropsWithUnistyles = PartialBy<TProps, keyof TMappings | SupportedStyleProps> & {
        uniProps?: Mappings<TProps>
        style?: UnistylesValues,
        contentContainerStyle?: UnistylesValues
    }

    return forwardRef<GenericComponentRef<TComponent>, PropsWithUnistyles>((props, ref) => {
        const narrowedProps = props as PropsWithUnistyles
        const styleClassNames = getClassName(narrowedProps.style)
        const contentContainerStyleClassNames = getClassName(narrowedProps.contentContainerStyle)
        const { proxifiedRuntime, proxifiedTheme } = useProxifiedUnistyles()

        const mappingsProps = mappings ? mappings(proxifiedTheme, proxifiedRuntime) : {}
        const unistyleProps = narrowedProps.uniProps ? narrowedProps.uniProps(proxifiedTheme, proxifiedRuntime) : {}

        const combinedProps = {
            ...deepMergeObjects(mappingsProps, unistyleProps, props),
            ...narrowedProps.style ? {
                style: styleClassNames,
            } : {},
            ...narrowedProps.contentContainerStyle ? {
                style: contentContainerStyleClassNames,
            } : {},
        } as any

        // @ts-ignore
        maybeWarnAboutMultipleUnistyles(narrowedProps.style, `withUnistyles(${Component.displayName ?? Component.name ?? 'Unknown'})`)
        // @ts-ignore
        maybeWarnAboutMultipleUnistyles(narrowedProps.contentContainerStyle, `withUnistyles(${Component.displayName ?? Component.name ?? 'Unknown'})`)

        const NativeComponent = Component as ComponentType

        return <NativeComponent {...combinedProps} ref={ref} />
    })
}
