import React, { forwardRef, useEffect, useRef, type ComponentType } from 'react'
import { StyleSheet, UnistyleDependency } from '../../specs'
import type { PartialBy } from '../../types/common'
import { deepMergeObjects } from '../../utils'
import { SUPPORTED_STYLE_PROPS } from './types'
import type { Mappings, SupportedStyleProps } from './types'
import { useDependencies } from './useDependencies'
import { maybeWarnAboutMultipleUnistyles } from '../warn'

// @ts-expect-error
type GenericComponentProps<P> = ComponentProps<P>
// @ts-expect-error
type GenericComponentRef<T> = ComponentRef<T>

export const withUnistyles = <TComponent, TMappings extends GenericComponentProps<TComponent>>(Component: TComponent, mappings?: Mappings<TMappings>) => {
    type TProps = GenericComponentProps<TComponent>
    type PropsWithUnistyles = PartialBy<TProps, keyof TMappings | SupportedStyleProps> & {
        uniProps?: Mappings<TProps>
    }

    return forwardRef<GenericComponentRef<TComponent>, PropsWithUnistyles>((props, ref) => {
        const narrowedProps = props as PropsWithUnistyles
        const stylesRef = useRef<Record<string, any>>({})
        const NativeComponent = Component as ComponentType

        const { mappingsCallback, addDependencies } = useDependencies(({ dependencies, updateTheme, updateRuntime }) => {
            const listensToTheme = dependencies.includes(UnistyleDependency.Theme)
            // @ts-expect-error - this is hidden from TS
            const dispose = StyleSheet.addChangeListener(changedDependencies => {
                if (listensToTheme && changedDependencies.includes(UnistyleDependency.Theme)) {
                    updateTheme()
                }

                if (changedDependencies.some((dependency: UnistyleDependency) => dependencies.includes(dependency))) {
                    updateRuntime()
                }
            })

            return () => dispose()
        })

        useEffect(() => {
            // @ts-ignore
            maybeWarnAboutMultipleUnistyles(narrowedProps.style, `withUnistyles(${Component.displayName ?? 'Unknown'})`)
            // @ts-ignore
            maybeWarnAboutMultipleUnistyles(narrowedProps.contentContainerStyle, `withUnistyles(${Component.displayName ?? 'Unknown'})`)

            const unistylesStyleKey = Object
                .keys(narrowedProps.style ?? {})
                .find(key => key.startsWith('unistyles-'))
            const unistylesContentContainerStyleKey = Object
                .keys(narrowedProps.contentContainerStyle ?? {})
                .find(key => key.startsWith('unistyles-'))

            const maybeStyleDependencies: Array<UnistyleDependency> = unistylesStyleKey
                ? narrowedProps.style?.[unistylesStyleKey].uni__dependencies
                : []
            const maybeContentContainerStyleDependencies: Array<UnistyleDependency> = unistylesContentContainerStyleKey
                ? narrowedProps.contentContainerStyle?.[unistylesContentContainerStyleKey].uni__dependencies
                : []

            addDependencies([...maybeStyleDependencies, ...maybeContentContainerStyleDependencies])
        }, [narrowedProps.style, narrowedProps.contentContainerStyle])

        const mappingProps = mappings ? mappingsCallback(mappings) : {}
        const unistyleProps = narrowedProps.uniProps ? mappingsCallback(narrowedProps.uniProps) : {}
        const finalProps = deepMergeObjects<Record<string, any>>(mappingProps, unistyleProps, props)

        // override with Unistyles styles
        SUPPORTED_STYLE_PROPS.forEach(propName => {
            if (finalProps[propName]) {
                finalProps[propName] = stylesRef.current[propName]
            }
        })

        return <NativeComponent {...finalProps as TProps} ref={ref} />
    })
}
