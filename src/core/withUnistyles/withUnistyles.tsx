import React, { useEffect, useState, type ComponentType, forwardRef, useRef, useMemo, type ComponentProps, type ComponentRef } from 'react'
import type { PartialBy } from '../../types/common'
import { UnistylesListener } from '../../web/listener'
import { UnistylesShadowRegistry } from '../../web'
import { equal } from '../../web/utils'
import { deepMergeObjects } from '../../utils'
import type { Mappings, SupportedStyleProps } from './types'
import { useDependencies } from './useDependencies'
import { UnistyleDependency } from '../../specs/NativePlatform'
import type { UnistylesValues } from '../../types'

const useShadowRegistry = (style?: Record<string, any>) => {
    const [ref] = useState(document.createElement('div'))
    const oldClassNames = useRef<Array<string>>([])
    const classNames = useMemo(() => {
        if (!style) {
            return []
        }

        const newClassNames = UnistylesShadowRegistry.add(ref, [style]) ?? []

        if (equal(oldClassNames.current, newClassNames)) {
            return oldClassNames.current
        }

        oldClassNames.current = newClassNames

        return newClassNames
    }, [style])

    useEffect(() => () => {
        // Remove styles on unmount
        if (style) {
            UnistylesShadowRegistry.add(null, [style])
        }
    })

    return classNames
}

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
        const styleClassNames = useShadowRegistry(narrowedProps.style)
        const contentContainerStyleClassNames = useShadowRegistry(narrowedProps.contentContainerStyle)
        const { mappingsCallback } = useDependencies(({ dependencies, updateTheme, updateRuntime }) => {
            const disposeTheme = UnistylesListener.addListeners(dependencies.filter(dependency => dependency === UnistyleDependency.Theme), updateTheme)
            const disposeRuntime = UnistylesListener.addListeners(dependencies.filter(dependency => dependency !== UnistyleDependency.Theme), updateRuntime)

            return () => {
                disposeTheme()
                disposeRuntime()
            }
        })
        const mappingsProps = mappings ? mappingsCallback(mappings) : {}
        const unistyleProps = narrowedProps.uniProps ? mappingsCallback(narrowedProps.uniProps) : {}

        const combinedProps = {
            ...deepMergeObjects(mappingsProps, unistyleProps, props),
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
        } as any

        const NativeComponent = Component as ComponentType

        return <NativeComponent {...combinedProps} ref={ref} />
    })
}
