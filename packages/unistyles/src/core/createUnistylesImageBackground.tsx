import type { ImageBackground, ImageBackgroundProps } from 'react-native'

import React from 'react'

import { UnistylesShadowRegistry } from '../specs'
import { copyComponentProperties } from '../utils'
import { passForwardedRef } from './passForwardRef'
import { maybeWarnAboutMultipleUnistyles } from './warn'

export const createUnistylesImageBackground = (Component: typeof ImageBackground) => {
    const UnistylesImageBackground = React.forwardRef<ImageBackground, ImageBackgroundProps>((props, forwardedRef) => {
        // @ts-expect-error we don't know the type of the component
        maybeWarnAboutMultipleUnistyles(props.style, 'ImageBackground')
        // @ts-ignore we don't know the type of the component
        maybeWarnAboutMultipleUnistyles(props.imageStyle, 'ImageBackground')

        return (
            <Component
                {...props}
                ref={(ref) => {
                    return passForwardedRef(
                        ref,
                        forwardedRef,
                        () => {
                            // @ts-expect-error - this is hidden from TS
                            UnistylesShadowRegistry.add(ref, props.style)
                        },
                        () => {
                            // @ts-expect-error - this is hidden from TS
                            UnistylesShadowRegistry.remove(ref)
                        },
                    )
                }}
                imageRef={(ref) => {
                    // @ts-expect-error web types are not compatible with RN styles
                    UnistylesShadowRegistry.add(ref, props.imageStyle)

                    return () => {
                        // @ts-ignore this is hidden from TS
                        UnistylesShadowRegistry.remove(ref)
                    }
                }}
            />
        )
    })

    return copyComponentProperties(Component, UnistylesImageBackground)
}
