import React, { useEffect, useState, type ComponentType, forwardRef, useRef, useMemo, type ComponentRef } from 'react'
import type { PartialBy } from '../../types/common'
import { UnistylesListener } from '../../web/listener'
import { UnistylesShadowRegistry } from '../../web'
import { equal } from '../../web/utils'
import { deepMergeObjects } from '../../utils'
import type { Mappings, SupportedStyleProps } from './types'
import { useDependencies } from './useDependencies'
import { UnistyleDependency } from '../../specs/NativePlatform'

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

export const withUnistyles = <TProps extends Record<string, any>, TComponent extends ComponentType<TProps>, TMappings extends TProps>(Component: TComponent, mappings?: Mappings<TMappings>) => {
    type PropsWithUnistyles = PartialBy<TProps, keyof TMappings | SupportedStyleProps> & {
        uniProps?: Mappings<TProps>
    }

    return forwardRef<ComponentRef<TComponent>, PropsWithUnistyles>((props, ref) => {
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
        } as TProps

        const NativeComponent = Component as ComponentType<TProps>

        return <NativeComponent {...combinedProps} ref={ref} />
    })
}
