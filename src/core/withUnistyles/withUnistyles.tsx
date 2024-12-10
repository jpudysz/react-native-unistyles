import React, { useEffect, useState, type ComponentType, forwardRef, useRef, useMemo } from 'react'
import { UnistyleDependency } from '../../specs/NativePlatform'
import type { PartialBy } from '../../types/common'
import { UnistylesListener } from '../../web/listener'
import { UnistylesShadowRegistry, UnistylesRuntime } from '../../web'
import { equal } from '../../web/utils'
import { deepMergeObjects } from '../../utils'
import type { Mappings, SupportedStyleProps } from './types'

const ALL_DEPENDENCIES = Object.values(UnistyleDependency).filter((dependency): dependency is UnistyleDependency => typeof dependency === 'number')

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

export const withUnistyles = <TProps extends Record<string, any>, TMappings extends TProps>(Component: ComponentType<TProps>, mappings?: Mappings<TMappings>) => {
    type PropsWithUnistyles = PartialBy<TProps, keyof TMappings | SupportedStyleProps> & {
        uniProps?: Mappings<TProps>
    }

    return forwardRef<unknown, PropsWithUnistyles>((props, ref) => {
        const narrowedProps = props as PropsWithUnistyles
        const [mappingsProps, setMappingsProps] = useState(mappings?.(UnistylesRuntime.getTheme(), UnistylesRuntime.miniRuntime) ?? {})
        const styleClassNames = useShadowRegistry(narrowedProps.style)
        const contentContainerStyleClassNames = useShadowRegistry(narrowedProps.contentContainerStyle)

        useEffect(() => {
            const disposeMappings = UnistylesListener.addListeners(ALL_DEPENDENCIES, () => {
                if (!mappings) {
                    disposeMappings()

                    return
                }

                return setMappingsProps(mappings(UnistylesRuntime.getTheme(), UnistylesRuntime.miniRuntime))
            })

            return () => disposeMappings()
        }, [mappingsProps, narrowedProps.style])

        const unistyleProps = narrowedProps.uniProps?.(UnistylesRuntime.getTheme(), UnistylesRuntime.miniRuntime) ?? {}

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
        } as unknown as TProps

        return <Component {...combinedProps} ref={ref} />
    })
}
