import React from 'react'
import { ImageBackground as NativeImageBackground } from 'react-native'
import { forwardRef } from 'react'
import type { UnistylesValues } from '../../types'
import { getClassName } from '../../core'
import { isServer } from '../../web/utils'
import { UnistylesShadowRegistry } from '../../web'

type Props = {
    style?: UnistylesValues
    imageStyle?: UnistylesValues
}

export const ImageBackground = forwardRef<unknown, Props>((props, forwardedRef) => {
    let storedRef: NativeImageBackground | null = null
    const styleClassNames = getClassName(props.style)
    const imageClassNames = getClassName(props.imageStyle)

    return (
        // @ts-expect-error - RN types are not compatible with RNW styles
        <NativeImageBackground
            {...props}
            style={styleClassNames}
            imageStyle={imageClassNames}
            ref={isServer() ? undefined : ref => {
                if (!ref) {
                    // @ts-expect-error hidden from TS
                    UnistylesShadowRegistry.remove(storedRef, styleClassNames?.hash)
                    // @ts-expect-error hidden from TS
                    UnistylesShadowRegistry.remove(storedRef, imageClassNames?.hash)
                }

                storedRef = ref
                    // @ts-expect-error hidden from TS
                    UnistylesShadowRegistry.add(ref, styleClassNames?.hash)
                    // @ts-expect-error hidden from TS
                    UnistylesShadowRegistry.add(ref, imageClassNames?.hash)

                if (typeof forwardedRef === 'function') {
                    return forwardedRef(ref)
                }

                if (forwardedRef) {
                    forwardedRef.current = ref
                }
            }}
        />
    )
})
