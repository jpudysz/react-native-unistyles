import React, { useRef } from 'react'
import type { ScrollView } from 'react-native'
import { UnistylesShadowRegistry } from '../specs'
import { copyComponentProperties } from '../utils'
import { passForwardedRef } from './passForwardRef'
import { maybeWarnAboutMultipleUnistyles } from './warn'

export const createUnistylesElement = (Component: any) => {
    const UnistylesComponent = (props: any) => {
        const scrollViewRef = useRef<ScrollView>(null)

        return (
            <Component
                {...props}
                ref={(ref: unknown) => {
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
                            UnistylesShadowRegistry.add(ref, props.style)
                        },
                        () => {
                            // @ts-ignore this is hidden from TS
                            UnistylesShadowRegistry.remove(ref)
                        }
                    )
                }}
            />
        )
    }

    return copyComponentProperties(Component, UnistylesComponent)
}
