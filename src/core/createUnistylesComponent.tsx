import React, { useEffect, useState, type ComponentType, forwardRef } from 'react'
import type { UnistylesTheme } from '../types'
import { UnistylesRuntime } from '../specs'
import { UnistyleDependency } from '../specs/NativePlatform'
import type { PartialBy } from '../types/common'
import { UnistylesListener } from '../web/listener'
import { UnistylesShadowRegistry } from '../web'
import { equal } from '../web/utils'

const SUPPORTED_STYLE_PROPS = ['style', 'contentContainerStyle'] as const
const ALL_DEPENDENCIES = Object.values(UnistyleDependency).filter((dependency): dependency is UnistyleDependency => typeof dependency === 'number')

type SupportedStyleProps = typeof SUPPORTED_STYLE_PROPS[number]

const useShadowRegistry = (style?: Record<string, any>) => {
    const [classNames, setClassNames] = useState<Array<string>>([])
    const [ref] = useState(document.createElement('div'))

    if (style) {
        UnistylesShadowRegistry
            .add(ref, style)
            .then(newClassNames => {
                if (equal(classNames, newClassNames)) {
                    return
                }

                setClassNames(newClassNames)
            })
    }

    useEffect(() => () => {
        // Remove styles on unmount
        UnistylesShadowRegistry.add(null, style)
    })

    return classNames
}

export const createUnistylesComponent = <TProps extends Record<string, any>, TMappings extends Partial<Omit<TProps, SupportedStyleProps>>>(Component: ComponentType<TProps>, mappings?: (theme: UnistylesTheme) => TMappings) => {
    return forwardRef<unknown, PartialBy<TProps, keyof TMappings | SupportedStyleProps>>((props, ref) => {
        const narrowedProps = props as PartialBy<TProps, keyof TMappings | SupportedStyleProps>
        const [mappingsProps, setMappingsProps] = useState(mappings?.(UnistylesRuntime.getTheme()))
        const styleClassNames = useShadowRegistry(narrowedProps.style)
        const contentContainerStyleClassNames = useShadowRegistry(narrowedProps.contentContainerStyle)

        useEffect(() => {
            const disposeMappings = UnistylesListener.addListeners(ALL_DEPENDENCIES, () => {
                if (!mappings) {
                    disposeMappings()

                    return
                }

                return setMappingsProps(mappings(UnistylesRuntime.getTheme()))
            })

            return () => disposeMappings()
        }, [mappingsProps, narrowedProps.style])

        const combinedProps = {
            ...mappingsProps,
            ...props,
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
