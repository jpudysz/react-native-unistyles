import React, { type ComponentType, forwardRef, useEffect, useRef, useState } from 'react'
import type { UnistylesTheme } from '../../types'
import {
    StyleSheet,
    UnistyleDependency,
    UnistylesRuntime,
    type UnistylesMiniRuntime,
    type UnistylesStyleSheet,
    UnistylesShadowRegistry
} from '../../specs'
import type { PartialBy } from '../../types/common'
import { deepMergeObjects } from '../../utils'
import { SUPPORTED_STYLE_PROPS } from './types'
import type { Mappings, SupportedStyleProps } from './types'

export const withUnistyles = <TProps extends Record<string, any>, TMappings extends TProps>(Component: ComponentType<TProps>, mappings?: Mappings<TMappings>) => {
    type PropsWithUnistyles = PartialBy<TProps, keyof TMappings | SupportedStyleProps> & {
        uniProps?: Mappings<TProps>
    }

    return forwardRef<unknown, PropsWithUnistyles>((props, ref) => {
        const narrowedProps = props as PropsWithUnistyles
        const scopedTheme = UnistylesShadowRegistry.getScopedTheme() as never
        const [theme, setTheme] = useState<UnistylesTheme>(UnistylesRuntime.getTheme(scopedTheme))
        const [, setRt] = useState(0)
        const stylesRef = useRef<Record<string, any>>({})
        const isForcedRef = useRef(false)

        if (!isForcedRef.current) {
            SUPPORTED_STYLE_PROPS.forEach(propName => {
                if (narrowedProps?.[propName]) {
                    if (Array.isArray(narrowedProps[propName])) {
                        console.error(`🦄 Unistyles: createUnistylesComponent requires ${propName} to be an object. Please check props for component: ${Component.displayName}`)
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
                const componentDependencies = narrowedProps.style?.__proto__.uni__dependencies as Array<UnistyleDependency>

                if (dependencies.includes(UnistyleDependency.Theme) && (!componentDependencies ||componentDependencies.includes(UnistyleDependency.Theme)) && !scopedTheme) {
                    setTheme(UnistylesRuntime.getTheme())

                    // override with Unistyles styles
                    SUPPORTED_STYLE_PROPS.forEach(propName => {
                        if (narrowedProps?.[propName]) {
                            stylesRef.current = {
                                ...stylesRef.current,
                                // @ts-expect-error - this is hidden from TS
                                [propName]: props[propName]
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

        const mappingProps = mappings?.(theme, UnistylesRuntime as unknown as UnistylesMiniRuntime) ?? {}
        const unistyleProps = narrowedProps.uniProps?.(theme, UnistylesRuntime as unknown as UnistylesMiniRuntime) ?? {}
        const finalProps = deepMergeObjects<Record<string, any>>(mappingProps, unistyleProps, props)

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
