import React, { forwardRef, useEffect, type ComponentType, useRef, type ComponentProps, type ComponentRef } from 'react'
import { type UnistyleDependency, UnistylesShadowRegistry } from '../../specs'
import type { UnistylesTheme } from '../../types'
import { deepMergeObjects } from '../../utils'
import { useProxifiedUnistyles } from '../useProxifiedUnistyles'
import { maybeWarnAboutMultipleUnistyles } from '../warn'
import type { Mappings } from './types'

// @ts-expect-error
type GenericComponentProps<P> = ComponentProps<P>
// @ts-expect-error
type GenericComponentRef<T> = ComponentRef<T>

type UnistylesSecrets = {
    uni__getStyles: () => Record<string, any>,
    uni__dependencies: Array<UnistyleDependency>
}

type MappedSecrets = {
    styles: Record<string, any>,
    dependencies: Array<UnistyleDependency>
}

export const withUnistyles = <TComponent, TMappings extends GenericComponentProps<TComponent>>(Component: TComponent, mappings?: Mappings<TMappings>) => {
    type TProps = GenericComponentProps<TComponent>
    type PropsWithUnistyles = Partial<TProps> & {
        uniProps?: Mappings<TProps>
    }

    const getSecrets = (styleProps: Record<string, any> = {}): MappedSecrets => {
        const styles = Array.isArray(styleProps)
            ? styleProps.flat()
            : [styleProps]

        const secrets: Array<UnistylesSecrets> = styles
            .filter(Boolean)
            .reduce((acc, style) => {
                const unistyleKey = Object
                    .keys(style)
                    .find(key => key.startsWith('unistyles_'))

                return acc.concat([
                    unistyleKey
                        ? style[unistyleKey]
                        : {
                            uni__getStyles: () => style,
                            uni__dependencies: [],
                        }
                ])
            }, [])

        return {
            styles: secrets.reduce((acc, secret) => Object
                .assign(acc, secret.uni__getStyles()), {} as Record<string, any>),
            dependencies: secrets.flatMap(secret => secret.uni__dependencies),
        }
    }

    return forwardRef<GenericComponentRef<TComponent>, PropsWithUnistyles>((props, ref) => {
        const narrowedProps = props as PropsWithUnistyles
        const NativeComponent = Component as ComponentType

        // @ts-ignore we don't know the type of the component
        maybeWarnAboutMultipleUnistyles(narrowedProps.style, `withUnistyles(${Component.displayName ?? Component.name ?? 'Unknown'})`)
        // @ts-ignore we don't know the type of the component
        maybeWarnAboutMultipleUnistyles(narrowedProps.contentContainerStyle, `withUnistyles(${Component.displayName ?? Component.name ?? 'Unknown'})`)

        const scopedTheme = useRef(UnistylesShadowRegistry.getScopedTheme() as UnistylesTheme)
        const { proxifiedRuntime, proxifiedTheme, addDependencies } = useProxifiedUnistyles(scopedTheme.current)

        useEffect(() => {
            const styleSecrets = getSecrets(narrowedProps.style)
            const contentContainerStyleSecrets = getSecrets(narrowedProps.contentContainerStyle)

            addDependencies(Array.from(new Set([...styleSecrets.dependencies, ...contentContainerStyleSecrets.dependencies])))
        }, [narrowedProps.style, narrowedProps.contentContainerStyle])

        const { key: mappingsKey, ...mappingsProps } = mappings ? mappings(proxifiedTheme, proxifiedRuntime) : {}
        const { key: uniPropsKey, ...unistyleProps } = narrowedProps.uniProps ? narrowedProps.uniProps(proxifiedTheme, proxifiedRuntime) : {}

        const styleSecrets = getSecrets(narrowedProps.style)
        const contentContainerStyleSecrets = getSecrets(narrowedProps.contentContainerStyle)

        const finalProps = {
            ...deepMergeObjects(mappingsProps, unistyleProps, props),
            ...narrowedProps.style ? {
                style: styleSecrets.styles,
            } : {},
            ...narrowedProps.contentContainerStyle ? {
                contentContainerStyle: contentContainerStyleSecrets.styles,
            } : {},
        } as any

        return (
            <NativeComponent
                key={uniPropsKey || mappingsKey}
                {...finalProps as TProps}
                ref={ref}
            />
        )
    })
}
