import React, { useEffect, useRef, useState, type ComponentType } from 'react'
import type { UnistylesTheme } from '../types'
import { UnistylesRuntime } from '../specs'
import { UnistyleDependency } from '../specs/NativePlatform'
import type { PartialBy } from '../types/common'
import { deepMergeObjects, extractSecrets, extractUnistyleDependencies } from '../web/utils'
import { UnistylesListener } from '../web/listener'
import { UnistylesRegistry } from '../web/registry'
import { getVariants } from '../web/variants'

const SUPPORTED_STYLE_PROPS = ['style', 'contentContainerStyle'] as const
const ALL_DEPENDENCIES = Object.values(UnistyleDependency).filter((dependency): dependency is UnistyleDependency => typeof dependency === 'number')

export const createUnistylesComponent = <TProps extends Record<string, any>, TMappings extends Partial<TProps>>(Component: ComponentType<TProps>, mappings?: (theme: UnistylesTheme) => TMappings) => {
    const getStyles = (styles: Record<string, any>) => {
        // Not a unistyle
        if (!Object.keys(styles).some(key => key.startsWith('__uni__'))) {
            return styles
        }

        const secrets = extractSecrets(styles)

        return deepMergeObjects(...secrets.map(({ __uni__key, __uni__stylesheet, __uni__args, __uni__variants }) => {
            const newComputedStylesheet = UnistylesRegistry.getComputedStylesheet(__uni__stylesheet)
            const style = newComputedStylesheet[__uni__key]!
            const result = typeof style === 'function'
                ? style(...__uni__args ?? [])
                : style
            const { variantsResult } = Object.fromEntries(getVariants({ variantsResult: result }, __uni__variants))
            const resultWithVariants = deepMergeObjects(result, variantsResult ?? {})

            return resultWithVariants
        }))
    }

    return (props: PartialBy<TProps, keyof TMappings | typeof SUPPORTED_STYLE_PROPS[number]>) => {
        const propsRef = useRef(props)
        const [style, setStyle] = useState(getStyles(props.style ?? {}))
        const [contentContainerStyle, setContentContainerStyle] = useState(getStyles(props.contentContainerStyle ?? {}))
        const [mappingsProps, setMappingsProps] = useState(mappings?.(UnistylesRuntime.getTheme()))

        propsRef.current = props

        useEffect(() => {
            const styleDependencies = extractUnistyleDependencies(props.style)
            const contentContainerStyleDependencies = extractUnistyleDependencies(props.contentContainerStyle)

            const disposeStyle = UnistylesListener.addListeners(styleDependencies, () => setStyle(getStyles(propsRef.current.style ?? {})))
            const disposeContentContainerStyle = UnistylesListener.addListeners(contentContainerStyleDependencies, () => setContentContainerStyle(getStyles(propsRef.current.contentContainerStyle ?? {})))
            const disposeMappings = UnistylesListener.addListeners(ALL_DEPENDENCIES, () => {
                if (!mappings) {
                    disposeMappings()

                    return
                }

                return setMappingsProps(mappings(UnistylesRuntime.getTheme()))
            })

            return () => {
                disposeStyle()
                disposeContentContainerStyle()
                disposeMappings()
            }
        }, [mappingsProps, props.style])

        const combinedProps = {
            ...mappingsProps,
            ...props,
            ...props.style ? { style } : {},
            ...props.contentContainerStyle ? { contentContainerStyle } : {}
        } as unknown as TProps

        return <Component {...combinedProps} />
    }
}
