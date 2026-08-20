import React, { type ComponentProps, forwardRef } from 'react'
import { type ImageStyle, Image as NativeImage, type StyleProp, type ViewStyle } from 'react-native'
import { getServerUnistylesStyle } from 'react-native-unistyles/internal/server-unistyles-style'

import type { UnistylesValues } from '../../types'

import { getClassName } from '../../core/getClassname'
import { maybeWarnAboutMultipleUnistyles } from '../../core/warn'
import { copyComponentProperties } from '../../utils'
import { checkForProp } from '../../web/utils'
import { createUnistylesRef } from '../../web/utils/createUnistylesRef'

type Props = ComponentProps<typeof NativeImage> & {
    style?: UnistylesValues
    imageStyle?: UnistylesValues
}

const UnistylesImage = forwardRef<unknown, Props>((props, forwardedRef) => {
    const classNames = getClassName(props.style)
    const ref = createUnistylesRef(classNames, forwardedRef)
    const hasWidthStyle = checkForProp(props.style, 'width')
    const hasHeightStyle = checkForProp(props.style, 'height')

    maybeWarnAboutMultipleUnistyles(props.style as ViewStyle, 'Image')

    const image = (
        <NativeImage
            {...props}
            style={
                [
                    classNames,
                    // Clear inline width and height extracted from source
                    hasWidthStyle && { width: '' },
                    hasHeightStyle && { height: '' },
                ] as StyleProp<ImageStyle>
            }
            ref={ref}
        />
    )
    const serverStyle = getServerUnistylesStyle([classNames])

    if (serverStyle) {
        return (
            <>
                {serverStyle}
                {image}
            </>
        )
    }

    return image
})

export const Image = copyComponentProperties(NativeImage, UnistylesImage)
