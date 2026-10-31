import type { ScrollView } from 'react-native'

import React, { useContext, useMemo, useRef } from 'react'

import { ScopedThemeContext } from '../components/ScopedThemeContext'
import { UnistylesShadowRegistry } from '../specs'
import { copyComponentProperties } from '../utils'
import { getUnistylesKey } from './getUnistylesKey'
import { passForwardedRef } from './passForwardRef'
import { maybeWarnAboutMultipleUnistyles } from './warn'

export const createUnistylesElement = (Component: any) => {
    const UnistylesComponent = (props: any) => {
        const scrollViewRef = useRef<ScrollView>(null)
        const scope = useContext(ScopedThemeContext)
        const unistylesKey = getUnistylesKey(props.style)

        // React detaches a ref and attaches it again whenever it gets a new function. A new one on every render
        // unlinked the view and linked it again on every render, even when nothing changed
        // so the ref stays the same while the unistyles, the scope and the user's ref stay the same
        // `props.style` is not a dependency: it is a new array on most renders, and only its unistyles matter
        const linkRef = useMemo(
            () => (ref: unknown) => {
                maybeWarnAboutMultipleUnistyles(props.style, Component.displayName)

                // https://github.com/facebook/react-native/issues/51878
                // tested with ScrollView, REA ScrolLView and Animated ScrollView
                const isScrollView = Component.displayName === 'ScrollView'

                if (isScrollView && ref) {
                    scrollViewRef.current = ref as ScrollView
                }

                if (isScrollView && !ref) {
                    // @ts-ignore this is hidden from TS
                    UnistylesShadowRegistry.remove(scrollViewRef.current)
                    scrollViewRef.current = null

                    return
                }

                return passForwardedRef(
                    ref,
                    props.ref,
                    () => {
                        // @ts-ignore this is hidden from TS
                        UnistylesShadowRegistry.add(ref, props.style, scope)
                    },
                    () => {
                        // @ts-ignore this is hidden from TS
                        UnistylesShadowRegistry.remove(ref)
                    },
                )
            },
            [unistylesKey, scope, props.ref],
        )

        // no unistyles to link, the view renders like a React Native view with the user's ref
        if (unistylesKey === '') {
            return <Component {...props} />
        }

        return <Component {...props} ref={linkRef} />
    }

    return copyComponentProperties(Component, UnistylesComponent)
}
