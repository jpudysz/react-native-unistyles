import React from 'react'
import { ImageBackground as NativeImageBackground } from 'react-native'
import { forwardRef } from 'react'
import { useClassname } from '../../hooks'
import type { UnistylesValues } from '../../types'

type Props = {
    style?: UnistylesValues
    imageStyle?: UnistylesValues
}

export const ImageBackground = forwardRef<unknown, Props>((props, ref) => {
    const styleClassNames = useClassname(props.style)
    const imageClassNames = useClassname(props.imageStyle)

    // @ts-expect-error - RN types are not compatible with RNW styles
    return <NativeImageBackground {...props} style={styleClassNames} imageStyle={imageClassNames} ref={ref} />
})
