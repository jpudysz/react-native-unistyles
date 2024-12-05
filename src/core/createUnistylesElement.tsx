import React from 'react'
import type { ViewProps, View } from 'react-native'
import { UnistylesShadowRegistry } from '../specs'

export const createUnistylesElement = (Component: typeof View) => React.forwardRef<View, ViewProps>((props, forwardedRef) => {
    return (
        <Component
            {...props}
            ref={ref => {
                const passForwardedRef = () => {
                    if (typeof forwardedRef === 'function') {
                        return forwardedRef(ref)
                    }

                    if (forwardedRef) {
                        forwardedRef.current = ref
                    }

                    return () => {}
                }
                const forwardedRefReturnFn = passForwardedRef()

                // @ts-expect-error - This is hidden from TS
                UnistylesShadowRegistry.add(ref, [props.style], [[]])

                return () => {
                    // @ts-expect-error - This is hidden from TS
                    UnistylesShadowRegistry.remove(ref)
                    forwardedRefReturnFn?.()
                }
            }}
        />
    )
})
