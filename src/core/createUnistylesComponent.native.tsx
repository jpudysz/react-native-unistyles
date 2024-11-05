import React, { type ComponentType, useEffect, useRef, useState } from 'react'
import type { UnistylesTheme } from '../types'
import { StyleSheet, UnistyleDependency, UnistylesRuntime, type UnistylesStyleSheet } from '../specs'
import type { PartialBy } from '../types/common'

const SUPPORTED_STYLE_PROPS = ['style', 'contentContainerStyle'] as const

export const createUnistylesComponent =<TProps extends Record<string, any>, TMappings extends Partial<TProps>>(Component: ComponentType<TProps>, mappings?: (theme: UnistylesTheme) => TMappings) => {
    return (props: PartialBy<TProps, keyof TMappings | typeof SUPPORTED_STYLE_PROPS[number]>) => {
        const [theme, setTheme] = useState<UnistylesTheme>(UnistylesRuntime.getTheme())
        const [, setRt] = useState(0)
        const stylesRef = useRef<Record<string, any>>({})
        const isForcedRef = useRef(false)

        if (!isForcedRef.current) {
            SUPPORTED_STYLE_PROPS.forEach(propName => {
                if (props?.[propName]) {
                    if (Array.isArray(props[propName])) {
                        console.error(`🦄 Unistyles: createUnistylesComponent requires ${propName} to be an object. Please check props for component: ${Component.displayName}`)
                    }

                    // @ts-expect-error - this is hidden from TS
                    if (props[propName].__unistyles_name && !props[propName].__proto__?.getStyle) {
                        console.error(`🦄 Unistyles: createUnistylesComponent received style that is not bound. You likely used the spread operator on a Unistyle style. Please check props for component: ${Component.displayName}`)
                    }

                    stylesRef.current = {
                        ...stylesRef.current,
                        [propName]: props[propName]
                    }
                }
            })
        }

        useEffect(() => {
            const removeChangeListener = (StyleSheet as UnistylesStyleSheet).addChangeListener(dependencies => {
                const componentDependencies = (props.style?.__proto__.uni__dependencies || mappings?.(theme).style?.__proto__.uni__dependencies) as Array<UnistyleDependency>

                if (dependencies.includes(UnistyleDependency.Theme) && (!componentDependencies ||componentDependencies.includes(UnistyleDependency.Theme))) {
                    setTheme(UnistylesRuntime.getTheme())

                    // override with Unistyles styles
                    SUPPORTED_STYLE_PROPS.forEach(propName => {
                        if (props?.[propName]) {
                            stylesRef.current = {
                                ...stylesRef.current,
                                // @ts-expect-error - this is hidden from TS
                                [propName]: props[propName].__proto__?.getStyle() || props[propName]
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

        const mergedProps = mappings?.(theme) as Record<string, any>

        Object.keys(props).forEach(key => {
            if (key in mergedProps) {
                mergedProps[key] = Object.assign(props[key as keyof typeof props], mergedProps[key])

                return
            }

            mergedProps[key] = props[key as keyof typeof props]
        })

        // override with Unistyles styles
        SUPPORTED_STYLE_PROPS.forEach(propName => {
            if (mergedProps[propName]) {
                mergedProps[propName] = stylesRef.current[propName]
            }
        })

        isForcedRef.current = false

        return <Component {...mergedProps as TProps} />
    }
}
