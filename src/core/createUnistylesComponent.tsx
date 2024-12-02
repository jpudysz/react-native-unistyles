import React, { useEffect, useState, type ComponentType, forwardRef, useRef, useMemo, useReducer } from 'react'
import type { UnistylesTheme } from '../types'
import { UnistylesRuntime, type UnistylesMiniRuntime } from '../specs'
import { UnistyleDependency } from '../specs/NativePlatform'
import type { PartialBy } from '../types/common'
import { UnistylesListener } from '../web/listener'
import { UnistylesShadowRegistry } from '../web'
import { equal } from '../web/utils'
import { deepMergeObjects } from '../utils'

const SUPPORTED_STYLE_PROPS = ['style', 'contentContainerStyle'] as const
const ALL_DEPENDENCIES = Object.values(UnistyleDependency).filter((dependency): dependency is UnistyleDependency => typeof dependency === 'number')

const getMiniRuntime = (): UnistylesMiniRuntime => {
    // @ts-expect-error - this is hidden from TS
    return UnistylesRuntime.miniRuntime
}

type SupportedStyleProps = typeof SUPPORTED_STYLE_PROPS[number]

const useShadowRegistry = (style?: Record<string, any>) => {
    const [ref] = useState(document.createElement('div'))
    const oldClassNames = useRef<Array<string>>([])
    const classNames = useMemo(() => {
        if (!style) {
            return []
        }

        const newClassNames = UnistylesShadowRegistry.add(ref, [style], undefined, []) ?? []

        if (equal(oldClassNames.current, newClassNames)) {
            return oldClassNames.current
        }

        oldClassNames.current = newClassNames

        return newClassNames
    }, [style])

    useEffect(() => () => {
        // Remove styles on unmount
        if (style) {
            UnistylesShadowRegistry.add(null, [style], undefined, [])
        }
    })

    return classNames
}

export const createUnistylesComponent = <TProps extends Record<string, any>, TMappings extends Partial<Omit<TProps, SupportedStyleProps>>>(Component: ComponentType<TProps>, mappings?: (theme: UnistylesTheme, rt: UnistylesMiniRuntime, props: PartialBy<TProps, keyof TMappings | SupportedStyleProps>) => TMappings) => {
    return forwardRef<unknown, PartialBy<TProps, keyof TMappings | SupportedStyleProps>>((props, ref) => {
        const narrowedProps = props as PartialBy<TProps, keyof TMappings | SupportedStyleProps>
        const [_, forceUpdate] = useReducer(() => ({}), {})
        const styleClassNames = useShadowRegistry(narrowedProps.style)
        const contentContainerStyleClassNames = useShadowRegistry(narrowedProps.contentContainerStyle)

        useEffect(() => {
            const disposeMappings = UnistylesListener.addListeners(ALL_DEPENDENCIES, () => {
                if (!mappings) {
                    disposeMappings()

                    return
                }

                forceUpdate()
            })

            return () => disposeMappings()
        }, [narrowedProps.style])

        const mappingsProps = mappings?.(UnistylesRuntime.getTheme(), getMiniRuntime(), narrowedProps) ?? {}
        const combinedProps = {
            ...deepMergeObjects(props, mappingsProps),
            ...narrowedProps.style ? {
                style: {
                    $$css: true,
                    'unistyles': styleClassNames.join(' ')
                },
            } : {},
            ...narrowedProps.contentContainerStyle ? {
                style: {
                    $$css: true,
                    'unistyles': contentContainerStyleClassNames.join(' ')
                },
            } : {},
        } as unknown as TProps

        return <Component {...combinedProps} ref={ref} />
    })
}
