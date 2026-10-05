import type { ViewStyle } from 'react-native'

import React, { useCallback, useContext, useLayoutEffect, useRef } from 'react'

import type { UnistylesValues } from '../types'

import { ScopedThemeContext, withScopedTheme } from '../components/ScopedThemeContext'
import { copyComponentProperties } from '../utils'
import * as unistyles from '../web/services'
import { isServer } from '../web/utils'
import { getClassName } from './getClassname'
import { maybeWarnAboutMultipleUnistyles } from './warn'

const STYLE_PROPS = ['contentContainerStyle', 'columnWrapperStyle'] as const

type StyleProp = (typeof STYLE_PROPS)[number] | 'style'

type ComponentProps = {
    [K in StyleProp]?: UnistylesValues
}

const buildUnistylesProps = (Component: any, props: ComponentProps) => {
    const componentStyleProps = ['style' as const, ...STYLE_PROPS.filter((styleProp) => styleProp in props)]

    componentStyleProps.forEach((styleProp) => {
        maybeWarnAboutMultipleUnistyles(props[styleProp] as ViewStyle, Component.displayName)
    })

    return Object.fromEntries(componentStyleProps.map((styleProp) => [styleProp, getClassName(props[styleProp])]))
}

const assignRef = (ref: React.Ref<unknown> | undefined, value: unknown) => {
    if (typeof ref === 'function') {
        ref(value)
    } else if (ref) {
        ref.current = value
    }
}

export const createUnistylesElement = (Component: any) => {
    const UnistylesComponent = ({ ref, ...props }: any) => {
        const scope = useContext(ScopedThemeContext)
        const classNames = withScopedTheme(scope, () => buildUnistylesProps(Component, props))
        const hashes = Object.values(classNames).map((className) => className?.[0].hash)
        const stored = useRef({ node: null as unknown, hashes, ref })
        // Stable for the component lifetime, as some components (e.g. ScrollView) call only the latest ref on unmount
        const unistylesRef = useCallback((node: unknown) => {
            const { shadowRegistry } = unistyles.services

            stored.current.hashes.forEach((hash) =>
                node ? shadowRegistry.add(node, hash) : shadowRegistry.remove(stored.current.node, hash),
            )
            stored.current.node = node
            assignRef(stored.current.ref, node)
        }, [])

        // React won't call a stable ref again, so apply style and ref changes after commit
        useLayoutEffect(() => {
            const { shadowRegistry } = unistyles.services
            const { node, hashes: previousHashes, ref: previousRef } = stored.current

            if (previousHashes.join() !== hashes.join()) {
                previousHashes.forEach((hash) => shadowRegistry.remove(node, hash))
                hashes.forEach((hash) => shadowRegistry.add(node, hash))
            }

            if (previousRef !== ref) {
                assignRef(previousRef, null)
                assignRef(ref, node)
            }

            stored.current = { node, hashes, ref }
        })

        return <Component {...props} {...classNames} ref={isServer() ? undefined : unistylesRef} />
    }

    return copyComponentProperties(Component, UnistylesComponent)
}
