import React from 'react'
import type { ImageBackground, ImageBackgroundProps } from 'react-native'
import { UnistylesShadowRegistry } from '../specs'
import { passForwardedRef } from './passForwardRef'

export const createUnistylesImageBackground = (Component: typeof ImageBackground) => React.forwardRef<ImageBackground, ImageBackgroundProps>((props, forwardedRef) => (
    <Component
        {...props}
        ref={ref => passForwardedRef(props, ref, forwardedRef)}
        imageRef={ref => {
            // todo, add first class support for image styles
            const style = Array.isArray(props.imageStyle)
                ? props.imageStyle
                : [props.imageStyle]

            // @ts-expect-error - This is hidden from TS
            UnistylesShadowRegistry.add(ref, style)

            return () => {
                // @ts-expect-error - This is hidden from TS
                UnistylesShadowRegistry.remove(ref)
            }
        }}
    />
))
