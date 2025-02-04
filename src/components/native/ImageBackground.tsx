import React from 'react'
import { forwardRef } from 'react'
import { ImageBackground as NativeImageBackground } from 'react-native'
import { getClassName } from '../../core'
import type { UnistylesValues } from '../../types'
import { copyComponentProperties } from '../../utils'
import { UnistylesShadowRegistry } from '../../web'
import { isServer } from '../../web/utils'

type Props = {
    style?: UnistylesValues
    imageStyle?: UnistylesValues
}

const UnistylesImageBackground = forwardRef<unknown, Props>((props, forwardedRef) => {
    let storedRef: NativeImageBackground | null = null
    let storedImageRef: NativeImageBackground | null = null
    const styleClassNames = getClassName(props.style)
    const imageClassNames = getClassName(props.imageStyle)

    return (
        // @ts-expect-error - RN types are not compatible with RNW styles
        <NativeImageBackground
            {...props}
            style={styleClassNames}
            imageStyle={imageClassNames}
            ref={
                isServer()
                    ? undefined
                    : ref => {
                          if (!ref) {
                              // @ts-expect-error hidden from TS
                              UnistylesShadowRegistry.remove(storedRef, styleClassNames?.hash)
                          }

                          storedRef = ref
                          // @ts-expect-error hidden from TS
                          UnistylesShadowRegistry.add(ref, styleClassNames?.hash)

                          if (typeof forwardedRef === 'function') {
                              return forwardedRef(ref)
                          }

                          if (forwardedRef) {
                              forwardedRef.current = ref
                          }
                      }
            }
            imageRef={
                isServer()
                    ? undefined
                    : ref => {
                          if (!ref) {
                              // @ts-expect-error hidden from TS
                              UnistylesShadowRegistry.remove(storedImageRef, imageClassNames?.hash)
                          }

                          storedImageRef = ref
                          // @ts-expect-error hidden from TS
                          UnistylesShadowRegistry.add(ref, imageClassNames?.hash)
                      }
            }
        />
    )
})

export const ImageBackground = copyComponentProperties(NativeImageBackground, UnistylesImageBackground)
