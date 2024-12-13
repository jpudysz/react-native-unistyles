import React, { forwardRef, useEffect, useRef, type ComponentType } from 'react'
import { StyleSheet, UnistyleDependency } from '../../specs'
import type { PartialBy } from '../../types/common'
import { deepMergeObjects } from '../../utils'
import { SUPPORTED_STYLE_PROPS } from './types'
import type { Mappings, SupportedStyleProps } from './types'
import { useDependencies } from './useDependencies'

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
        const isForcedRef = useRef(false)
        const NativeComponent = Component as ComponentType

        if (!isForcedRef.current) {
            SUPPORTED_STYLE_PROPS.forEach(propName => {
                if (narrowedProps?.[propName]) {
                    if (Array.isArray(narrowedProps[propName])) {
                        console.error(`🦄 Unistyles: withUnistyles requires ${propName} to be an object. Please check props for component: ${NativeComponent.displayName}`)
                    }

                    // @ts-expect-error - this is hidden from TS
                    if (props[propName].__unistyles_name && !props[propName].__proto__?.getStyle) {
                        console.error(`🦄 Unistyles: withUnistyles received style that is not bound. You likely used the spread operator on a Unistyle style. Please check props for component: ${NativeComponent.displayName}`)
                    }

                    stylesRef.current = {
                        ...stylesRef.current,
                        [propName]: narrowedProps[propName]
                    }
                }
            })
        }

        const { mappingsCallback, addDependencies } = useDependencies(({ dependencies, updateTheme, updateRuntime }) => {
            const listensToTheme = dependencies.includes(UnistyleDependency.Theme)
            // @ts-expect-error - this is hidden from TS
            const dispose = StyleSheet.addChangeListener(changedDependencies => {
                if (listensToTheme && changedDependencies.includes(UnistyleDependency.Theme)) {
                    updateTheme()
                }

                if (changedDependencies.some((dependency: UnistyleDependency) => dependencies.includes(dependency))) {
                    SUPPORTED_STYLE_PROPS.forEach(propName => {
                        if (narrowedProps?.[propName]) {
                            stylesRef.current = {
                                ...stylesRef.current,
                                // @ts-expect-error - this is hidden from TS
                                [propName]: props[propName].__proto__?.getStyle?.() || props[propName]
                            }

                            isForcedRef.current = true
                        }
                    })

                    updateRuntime()
                }
            })

            return () => dispose()
        })

        useEffect(() => {
            const styleDependencies = narrowedProps.style?.__proto__.uni__dependencies ?? [] as Array<UnistyleDependency>
            const contentContainerStyleDependencies = narrowedProps.contentContainerStyle?.__proto__.uni__dependencies ?? [] as Array<UnistyleDependency>

            addDependencies([...styleDependencies, ...contentContainerStyleDependencies])
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

        isForcedRef.current = false

        return <NativeComponent {...finalProps as TProps} ref={ref} />
    })
}
