import React, { useEffect, useRef } from 'react'
import { UnistylesShadowRegistry } from '../specs'
import { passForwardedRef } from './passForwardRef'
import { maybeWarnAboutMultipleUnistyles } from './warn'

const getNativeRef = (Component: any, ref: any) => {
    switch (Component.name) {
        case 'KeyboardAvoidingView':
            return ref.viewRef?.current
        case 'FlatList':
            return ref.getNativeScrollRef?.()
        case 'VirtualizedList':
            return ref.getScrollRef?.()
        default:
            return ref
    }
}

export const createUnistylesElement = (Component: any) => React.forwardRef((props, forwardedRef) => {
    const storedRef = useRef<unknown>(null)

    useEffect(() => {
        return () => {
            if (storedRef.current) {
                // @ts-ignore
                UnistylesShadowRegistry.remove(storedRef.current)
            }
        }
    }, [])

    return (
        <Component
            {...props}
            ref={(ref: unknown) => {
                if (ref) {
                    storedRef.current = getNativeRef(Component, ref)
                }

                passForwardedRef(props, ref, forwardedRef)

                // @ts-ignore we don't know the type of the component
                maybeWarnAboutMultipleUnistyles(props.style, Component.displayName)
            }}
        />
    )
})
