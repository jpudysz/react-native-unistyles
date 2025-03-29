import React, { useLayoutEffect, useRef } from 'react'
import type { Image, ImageBackground, ImageBackgroundProps } from 'react-native'
import { UnistylesShadowRegistry } from '../specs'
import { copyComponentProperties } from '../utils'
import { passForwardedRef } from './passForwardRef'
import { maybeWarnAboutMultipleUnistyles } from './warn'

export const createUnistylesImageBackground = (Component: typeof ImageBackground) => {
    const UnistylesImageBackground = React.forwardRef<ImageBackground, ImageBackgroundProps>((props, forwardedRef) => {
        const storedImageRef = useRef<Image | null>(null)

        useLayoutEffect(() => {
            return () => {
                if (storedImageRef.current) {
                    // @ts-ignore
                    UnistylesShadowRegistry.remove(storedImageRef.current)
                }
            }
        }, [])

        // @ts-expect-error we don't know the type of the component
        maybeWarnAboutMultipleUnistyles(props.style, 'ImageBackground')
        // @ts-ignore we don't know the type of the component
        maybeWarnAboutMultipleUnistyles(props.imageStyle, 'ImageBackground')

        return (
            <Component
                {...props}
                ref={ref => {
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

                            if (storedImageRef.current) {
                                // @ts-expect-error - this is hidden from TS
                                UnistylesShadowRegistry.remove(storedImageRef.current)
                            }
                        }
                    )
                }}
                imageRef={ref => {
                    if (ref) {
                        storedImageRef.current = ref
                    }

                    // @ts-expect-error web types are not compatible with RN styles
                    UnistylesShadowRegistry.add(ref, props.imageStyle)
                }}
            />
        )
    })

    return copyComponentProperties(Component, UnistylesImageBackground)
}
