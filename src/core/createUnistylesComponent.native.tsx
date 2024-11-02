import React, { type ComponentProps, type ComponentType, useEffect, useRef, useState } from 'react'
import type { UnistylesTheme } from '../types'
import { StyleSheet, UnistyleDependency, UnistylesRuntime, type UnistylesStyleSheet } from '../specs'

type Mappings<T extends ComponentType<any>> = (theme: UnistylesTheme) => Partial<Omit<ComponentProps<T>, typeof SUPPORTED_STYLE_PROPS[number]>>

const SUPPORTED_STYLE_PROPS = ['style', 'contentContainerStyle'] as const

export const createUnistylesComponent = <T extends ComponentType<any>>(Component: T, mappings: Mappings<T> = () => ({})) => {
    return (props: ComponentProps<T>) => {
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
                const componentDependencies = (props.style?.__proto__.uni__dependencies || mappings(theme).style?.__proto__.uni__dependencies) as Array<UnistyleDependency>

                if (dependencies.includes(UnistyleDependency.Theme) && (!componentDependencies ||componentDependencies.includes(UnistyleDependency.Theme))) {
                    setTheme(UnistylesRuntime.getTheme())

                    // override with Unistyles styles
                    SUPPORTED_STYLE_PROPS.forEach(propName => {
                        if (props?.[propName]) {
                            stylesRef.current = {
                                ...stylesRef.current,
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

        const mergedProps = { ...mappings(theme) } as ComponentProps<T>

        Object.keys(props).forEach(key => {
            if (key in mergedProps) {
                mergedProps[key] = Object.assign(props[key], mergedProps[key])

                return
            }

            mergedProps[key] = props[key]
        })

        // override with Unistyles styles
        SUPPORTED_STYLE_PROPS.forEach(propName => {
            if (mergedProps[propName]) {
                mergedProps[propName] = stylesRef.current[propName]
            }
        })

        isForcedRef.current = false

        return <Component {...mergedProps} />
    }
}
