import React, { type ComponentType, forwardRef, type ComponentProps, type ComponentRef } from 'react'
import type { UnistylesValues } from '../../types'
import { deepMergeObjects } from '../../utils'
import { getClassName } from '../getClassname'
import { useProxifiedUnistyles } from '../useProxifiedUnistyles'
import { maybeWarnAboutMultipleUnistyles } from '../warn'
import type { Mappings } from './types'

// @ts-expect-error
type GenericComponentProps<T> = ComponentProps<T>
// @ts-expect-error
type GenericComponentRef<T> = ComponentRef<T>

export const withUnistyles = <TComponent, TMappings extends GenericComponentProps<TComponent>>(Component: TComponent, mappings?: Mappings<TMappings>) => {
    type TProps = GenericComponentProps<TComponent>
    type PropsWithUnistyles = Partial<TProps> & {
        uniProps?: Mappings<TProps>
    }
    type UnistyleStyles = {
        style?: UnistylesValues,
        contentContainerStyle?: UnistylesValues
    }

    return forwardRef<GenericComponentRef<TComponent>, PropsWithUnistyles>((props, ref) => {
        const narrowedProps = props as PropsWithUnistyles & UnistyleStyles
        const styleClassNames = getClassName(narrowedProps.style, true)
        const contentContainerStyleClassNames = getClassName(narrowedProps.contentContainerStyle)
        const { proxifiedRuntime, proxifiedTheme } = useProxifiedUnistyles()

        const mappingsProps = mappings ? mappings(proxifiedTheme, proxifiedRuntime) : {}
        const unistyleProps = narrowedProps.uniProps ? narrowedProps.uniProps(proxifiedTheme, proxifiedRuntime) : {}


        const emptyStyles = narrowedProps.style
            ? Object.fromEntries(
                  Object.entries(Object.getOwnPropertyDescriptors(narrowedProps.style))
                      .filter(([key]) => !key.startsWith("unistyles") && !key.startsWith("_"))
                      .map(([key]) => [key, undefined])
              )
            : undefined

        const combinedProps = {
            ...deepMergeObjects(mappingsProps, unistyleProps, props),
            ...narrowedProps.style ? {
                // Override default component styles with undefined values to reset them
                style: emptyStyles
            } : {},
            ...narrowedProps.contentContainerStyle ? {
                contentContainerStyle: contentContainerStyleClassNames,
            } : {},
        } as any

        // @ts-ignore
        maybeWarnAboutMultipleUnistyles(narrowedProps.style, `withUnistyles(${Component.displayName ?? Component.name ?? 'Unknown'})`)
        // @ts-ignore
        maybeWarnAboutMultipleUnistyles(narrowedProps.contentContainerStyle, `withUnistyles(${Component.displayName ?? Component.name ?? 'Unknown'})`)

        const NativeComponent = Component as ComponentType

        return (
            <div
                className={styleClassNames?.hash}
                style={{ display: 'contents' }}
            >
                <NativeComponent {...combinedProps} ref={ref} />
            </div>
        )
    })
}
