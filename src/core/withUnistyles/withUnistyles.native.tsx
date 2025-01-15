import React, { forwardRef, useEffect, type ComponentType } from 'react'
import { StyleSheet, UnistyleDependency } from '../../specs'
import type { PartialBy } from '../../types/common'
import { deepMergeObjects } from '../../utils'
import type { Mappings, SupportedStyleProps } from './types'
import { useDependencies } from './useDependencies'
import { maybeWarnAboutMultipleUnistyles } from '../warn'

// @ts-expect-error
type GenericComponentProps<P> = ComponentProps<P>
// @ts-expect-error
type GenericComponentRef<T> = ComponentRef<T>

export const withUnistyles = <TComponent, TMappings extends GenericComponentProps<TComponent>>(Component: TComponent, mappings?: Mappings<TMappings>) => {
    type TProps = GenericComponentProps<TComponent>
    type PropsWithUnistyles = PartialBy<TProps, keyof TMappings | SupportedStyleProps> & {
        uniProps?: Mappings<TProps>
    }
    const getSecrets = (styleProps: Record<string, any> = {}): { uni__getStyles(): any, uni__dependencies: Array<UnistyleDependency> } => {
        const unistyleKey = Object
            .keys(styleProps)
            .find(key => key.startsWith('unistyles-'))

        return unistyleKey
            ? styleProps[unistyleKey]
            : {
                uni__getStyles: () => styleProps,
                uni__dependencies: [],
            }
    }

    return forwardRef<GenericComponentRef<TComponent>, PropsWithUnistyles>((props, ref) => {
        const narrowedProps = props as PropsWithUnistyles
        const NativeComponent = Component as ComponentType

        // @ts-ignore we don't know the type of the component
        maybeWarnAboutMultipleUnistyles(narrowedProps.style, `withUnistyles(${Component.displayName ?? 'Unknown'})`)
        // @ts-ignore we don't know the type of the component
        maybeWarnAboutMultipleUnistyles(narrowedProps.contentContainerStyle, `withUnistyles(${Component.displayName ?? 'Unknown'})`)

        const { mappingsCallback, addDependencies } = useDependencies(({ dependencies, updateTheme, updateRuntime }) => {
            const listensToTheme = dependencies.includes(UnistyleDependency.Theme)
            // @ts-expect-error - this is hidden from TS
            const dispose = StyleSheet.addChangeListener(changedDependencies => {
                if (listensToTheme && changedDependencies.includes(UnistyleDependency.Theme)) {
                    updateTheme()
                }

                if (changedDependencies.some((dependency: UnistyleDependency) => dependencies.includes(dependency))) {
                    updateRuntime()
                }
            })

            return () => dispose()
        })

        useEffect(() => {
            const styleSecrets = getSecrets(narrowedProps.style)
            const contentContainerStyleSecrets = getSecrets(narrowedProps.contentContainerStyle)

            addDependencies(Array.from(new Set([...styleSecrets.uni__dependencies, ...contentContainerStyleSecrets.uni__dependencies])))
        }, [narrowedProps.style, narrowedProps.contentContainerStyle])

        const mappingsProps = mappings ? mappingsCallback(mappings) : {}
        const unistyleProps = narrowedProps.uniProps ? mappingsCallback(narrowedProps.uniProps) : {}

        const styleSecrets = getSecrets(narrowedProps.style)
        const contentContainerStyleSecrets = getSecrets(narrowedProps.contentContainerStyle)

        const finalProps = {
            ...deepMergeObjects(mappingsProps, unistyleProps, props),
            ...narrowedProps.style ? {
                style: styleSecrets.uni__getStyles(),
            } : {},
            ...narrowedProps.contentContainerStyle ? {
                contentContainerStyle: contentContainerStyleSecrets.uni__getStyles(),
            } : {},
        } as any

        return <NativeComponent {...finalProps as TProps} ref={ref} />
    })
}
