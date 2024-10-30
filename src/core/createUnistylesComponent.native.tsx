import React, { type ComponentProps, type ComponentType, useEffect, useState } from 'react'
import type { UnistylesTheme } from '../types'
import { StyleSheet, UnistyleDependency, UnistylesRuntime, type UnistylesStyleSheet } from '../specs'

type Mappings<T extends ComponentType<any>> = (theme: UnistylesTheme) => Partial<ComponentProps<T>>

export const createUnistylesComponent = <T extends ComponentType<any>>(Component: T, mappings: Mappings<T>) => {
    return (props: ComponentProps<T>) => {
        const [theme, setTheme] = useState<UnistylesTheme>(UnistylesRuntime.getTheme())
        const [, setRt] = useState(0)

        useEffect(() => {
            const removeChangeListener = (StyleSheet as UnistylesStyleSheet).addChangeListener(dependencies => {
                const componentDependencies = (props.style?.uni__dependencies || mappings(theme).style?.uni__dependencies) as Array<UnistyleDependency>

                if (dependencies.includes(UnistyleDependency.Theme) && (!componentDependencies ||componentDependencies.includes(UnistyleDependency.Theme))) {
                    setTheme(UnistylesRuntime.getTheme())
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

        return <Component {...mergedProps} />
    }
}
