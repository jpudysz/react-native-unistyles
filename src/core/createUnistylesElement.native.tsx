import React, { useEffect, useRef } from 'react'
import { UnistylesShadowRegistry } from '../specs'
import { passForwardedRef } from './passForwardRef'
import { maybeWarnAboutMultipleUnistyles } from './warn'

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
                    storedRef.current = ref
                }

                passForwardedRef(props, ref, forwardedRef)
                maybeWarnAboutMultipleUnistyles(props, Component.displayName)
            }}
        />
    )
})
