import React, { type ComponentType, forwardRef, useEffect, useRef, useState } from 'react'
import type { UnistylesTheme } from '../types'
import { StyleSheet, UnistyleDependency, UnistylesRuntime, type UnistylesStyleSheet } from '../specs'
import type { PartialBy } from '../types/common'
import { deepMergeObjects } from '../utils'

const SUPPORTED_STYLE_PROPS = ['style', 'contentContainerStyle'] as const
type SupportedStyleProps = typeof SUPPORTED_STYLE_PROPS[number]

export const createUnistylesComponent = <TProps extends Record<string, any>, TMappings extends Partial<Omit<TProps, SupportedStyleProps>>>(Component: ComponentType<TProps>, mappings?: (theme: UnistylesTheme) => TMappings) => {
    return forwardRef<unknown, PartialBy<TProps, keyof TMappings | SupportedStyleProps>>((props, ref) => {
        const narrowedProps = props as PartialBy<TProps, keyof TMappings | SupportedStyleProps>
        const [theme, setTheme] = useState<UnistylesTheme>(UnistylesRuntime.getTheme())
        const [, setRt] = useState(0)
        const stylesRef = useRef<Record<string, any>>({})
        const isForcedRef = useRef(false)

        if (!isForcedRef.current) {
            SUPPORTED_STYLE_PROPS.forEach(propName => {
                if (narrowedProps?.[propName]) {
                    if (Array.isArray(narrowedProps[propName])) {
                        console.error(`🦄 Unistyles: createUnistylesComponent requires ${propName} to be an object. Please check props for component: ${Component.displayName}`)
                    }

                    // @ts-expect-error - this is hidden from TS
                    if (props[propName].__unistyles_name && !props[propName].__proto__?.getStyle) {
                        console.error(`🦄 Unistyles: createUnistylesComponent received style that is not bound. You likely used the spread operator on a Unistyle style. Please check props for component: ${Component.displayName}`)
                    }

                    stylesRef.current = {
                        ...stylesRef.current,
                        [propName]: narrowedProps[propName]
                    }
                }
            })
        }

        useEffect(() => {
            const removeChangeListener = (StyleSheet as UnistylesStyleSheet).addChangeListener(dependencies => {
                const componentDependencies = (narrowedProps.style?.__proto__.uni__dependencies || mappings?.(theme).style?.__proto__.uni__dependencies) as Array<UnistyleDependency>

                if (dependencies.includes(UnistyleDependency.Theme) && (!componentDependencies ||componentDependencies.includes(UnistyleDependency.Theme))) {
                    setTheme(UnistylesRuntime.getTheme())

                    // override with Unistyles styles
                    SUPPORTED_STYLE_PROPS.forEach(propName => {
                        if (narrowedProps?.[propName]) {
                            stylesRef.current = {
                                ...stylesRef.current,
                                // @ts-expect-error - this is hidden from TS
                                [propName]: props[propName].__proto__?.getStyle?.() || props[propName]
                            }
                        }
                    })

                    isForcedRef.current = true
                }

                if (dependencies.some(dependency => dependency >= 2) && (!componentDependencies || componentDependencies.some(dependency => dependency >= 2))) {
                    setRt(prevState => prevState + 1)
                }
            })

            return () => {
                removeChangeListener()
            }
        }, [])

        const mergedProps = mappings?.(theme) as Record<string, any> ?? {}
        const finalProps = deepMergeObjects(mergedProps, props)

        // override with Unistyles styles
        SUPPORTED_STYLE_PROPS.forEach(propName => {
            if (finalProps[propName]) {
                finalProps[propName] = stylesRef.current[propName]
            }
        })

        isForcedRef.current = false

        return <Component {...finalProps as TProps} ref={ref} />
    })
}
