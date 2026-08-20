import React, { type ComponentType, forwardRef, type ComponentProps, type ComponentRef } from 'react'
import {
    getServerUnistylesStyle,
    isReactServerComponentRender,
} from 'react-native-unistyles/internal/server-unistyles-style'

import type { UnistylesMiniRuntime } from '../../specs'
import type { UnistylesTheme, UnistylesValues } from '../../types'
import type { Mappings } from './types'

import { deepMergeObjects } from '../../utils'
import * as unistyles from '../../web/services'
import { createUnistylesRef } from '../../web/utils/createUnistylesRef'
import { getClassName } from '../getClassname'
import { useProxifiedUnistyles } from '../useProxifiedUnistyles'
import { maybeWarnAboutMultipleUnistyles } from '../warn'

// @ts-expect-error
type GenericComponentProps<T> = ComponentProps<T>
// @ts-expect-error
type GenericComponentRef<T> = ComponentRef<T>

export const withUnistyles = <TComponent, TMappings extends GenericComponentProps<TComponent>>(
    Component: TComponent,
    mappings?: Mappings<TMappings>,
) => {
    type TProps = GenericComponentProps<TComponent>
    type PropsWithUnistyles = Partial<TProps> & {
        uniProps?: Mappings<TProps>
    }
    type UnistyleStyles = {
        style?: UnistylesValues
        contentContainerStyle?: UnistylesValues
    }

    const renderComponent = (
        props: PropsWithUnistyles,
        ref: React.ForwardedRef<GenericComponentRef<TComponent>>,
        theme: UnistylesTheme,
        runtime: UnistylesMiniRuntime,
    ) => {
        const narrowedProps = props as PropsWithUnistyles & UnistyleStyles
        const styleClassNames = getClassName(narrowedProps.style, true)
        const contentContainerStyleClassNames = getClassName(narrowedProps.contentContainerStyle)

        const { key: mappingsKey, ...mappingsProps } = mappings ? mappings(theme, runtime) : {}
        const { key: uniPropsKey, ...unistyleProps } = narrowedProps.uniProps
            ? narrowedProps.uniProps(theme, runtime)
            : {}

        const emptyStyles = narrowedProps.style
            ? Object.fromEntries(
                  Object.entries(Object.getOwnPropertyDescriptors(narrowedProps.style))
                      .filter(([key]) => !key.startsWith('unistyles') && !key.startsWith('_'))
                      .map(([key]) => [key, undefined]),
              )
            : undefined

        const combinedProps = {
            ...deepMergeObjects(mappingsProps, unistyleProps, props),
            ...(narrowedProps.style
                ? {
                      // Override default component styles with undefined values to reset them
                      style: emptyStyles,
                  }
                : {}),
            ...(narrowedProps.contentContainerStyle
                ? {
                      contentContainerStyle: contentContainerStyleClassNames,
                  }
                : {}),
        } as any

        // @ts-ignore
        // prettier-ignore
        maybeWarnAboutMultipleUnistyles(narrowedProps.style, `withUnistyles(${Component.displayName ?? Component.name ?? 'Unknown'})`)
        // @ts-ignore
        // prettier-ignore
        maybeWarnAboutMultipleUnistyles(narrowedProps.contentContainerStyle, `withUnistyles(${Component.displayName ?? Component.name ?? 'Unknown'})`)

        const NativeComponent = Component as ComponentType
        const [classNames] = styleClassNames ?? []
        const styleRef = createUnistylesRef(styleClassNames)
        const serverStyle = getServerUnistylesStyle([styleClassNames, contentContainerStyleClassNames])
        const element = (
            <div className={classNames?.hash} ref={styleRef} style={{ display: 'contents' }}>
                <NativeComponent key={uniPropsKey || mappingsKey} {...combinedProps} ref={ref} />
            </div>
        )

        return serverStyle ? (
            <>
                {serverStyle}
                {element}
            </>
        ) : (
            element
        )
    }

    const ClientComponent = forwardRef<GenericComponentRef<TComponent>, PropsWithUnistyles>((props, ref) => {
        const { proxifiedRuntime, proxifiedTheme } = useProxifiedUnistyles()

        return renderComponent(props as PropsWithUnistyles, ref, proxifiedTheme, proxifiedRuntime)
    })

    return forwardRef<GenericComponentRef<TComponent>, PropsWithUnistyles>((props, ref) => {
        if (isReactServerComponentRender()) {
            return renderComponent(
                props as PropsWithUnistyles,
                ref,
                unistyles.services.runtime.theme,
                unistyles.services.runtime.miniRuntime,
            )
        }

        return React.createElement(ClientComponent as any, { ...props, ref } as any)
    })
}
