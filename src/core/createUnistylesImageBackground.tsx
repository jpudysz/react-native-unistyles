import React, { useEffect, useRef } from 'react'
import type { Image, ImageBackground, ImageBackgroundProps } from 'react-native'
import { UnistylesShadowRegistry } from '../specs'
import { passForwardedRef } from './passForwardRef'
import { maybeWarnAboutMultipleUnistyles } from './warn'

export const createUnistylesImageBackground = (Component: typeof ImageBackground) => React.forwardRef<ImageBackground, ImageBackgroundProps>((props, forwardedRef) => {
    const storedImageRef = useRef<Image | null>(null)

    useEffect(() => {
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
                passForwardedRef(props, ref, forwardedRef)

                return () => {
                    // @ts-ignore
                    UnistylesShadowRegistry.remove(ref)
                }
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
