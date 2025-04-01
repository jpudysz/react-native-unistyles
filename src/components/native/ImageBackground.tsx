import React from 'react'
import { forwardRef } from 'react'
import { type ImageStyle, ImageBackground as NativeImageBackground, type StyleProp, type ViewStyle } from 'react-native'
import { getClassName } from '../../core'
import { maybeWarnAboutMultipleUnistyles } from '../../core/warn'
import type { UnistylesValues } from '../../types'
import { copyComponentProperties } from '../../utils'
import { createUnistylesRef, keyInObject } from '../../web/utils'

type Props = {
    style?: UnistylesValues
    imageStyle?: UnistylesValues
}

const UnistylesImageBackground = forwardRef<unknown, Props>((props, forwardedRef) => {
    const styleClassNames = getClassName(props.style)
    const imageClassNames = getClassName(props.imageStyle)
    const ref = createUnistylesRef(styleClassNames, forwardedRef)
    const imageRef = createUnistylesRef(imageClassNames)
    const hasWidthStyle = typeof props.imageStyle === 'object' && keyInObject(props.imageStyle, 'width')
    const hasHeightStyle = typeof props.imageStyle === 'object' && keyInObject(props.imageStyle, 'height')

    maybeWarnAboutMultipleUnistyles(props.style as ViewStyle, 'ImageBackground')
    maybeWarnAboutMultipleUnistyles(props.imageStyle as ViewStyle, 'ImageBackground')

    return (
        <NativeImageBackground
            {...props}
            style={styleClassNames as StyleProp<ViewStyle>}
            imageStyle={[
                imageClassNames,
                // Clear inline width and height extracted from source
                hasWidthStyle && { width: '' },
                hasHeightStyle && { height: '' }
            ] as StyleProp<ImageStyle>}
            ref={ref}
            imageRef={imageRef}
        />
    )
})

export const ImageBackground = copyComponentProperties(NativeImageBackground, UnistylesImageBackground)
