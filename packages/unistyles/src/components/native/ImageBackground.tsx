import React from 'react'
import { forwardRef } from 'react'
import { type ImageStyle, ImageBackground as NativeImageBackground, type StyleProp, type ViewStyle } from 'react-native'
import { getServerUnistylesStyle } from 'react-native-unistyles/internal/server-unistyles-style'

import type { UnistylesValues } from '../../types'

import { getClassName } from '../../core/getClassname'
import { maybeWarnAboutMultipleUnistyles } from '../../core/warn'
import { copyComponentProperties } from '../../utils'
import { keyInObject } from '../../web/utils'
import { createUnistylesRef } from '../../web/utils/createUnistylesRef'

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

    const imageBackground = (
        <NativeImageBackground
            {...props}
            style={styleClassNames as StyleProp<ViewStyle>}
            imageStyle={
                [
                    imageClassNames,
                    // Clear inline width and height extracted from source
                    hasWidthStyle && { width: '' },
                    hasHeightStyle && { height: '' },
                ] as StyleProp<ImageStyle>
            }
            ref={ref}
            imageRef={imageRef}
        />
    )
    const serverStyle = getServerUnistylesStyle([styleClassNames, imageClassNames])

    if (serverStyle) {
        return (
            <>
                {serverStyle}
                {imageBackground}
            </>
        )
    }

    return imageBackground
})

export const ImageBackground = copyComponentProperties(NativeImageBackground, UnistylesImageBackground)
