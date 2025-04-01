import React, { type ComponentProps, forwardRef } from 'react'
import { type ImageStyle, Image as NativeImage, type StyleProp, type ViewStyle } from 'react-native'
import { getClassName } from '../../core'
import { maybeWarnAboutMultipleUnistyles } from '../../core/warn'
import type { UnistylesValues } from '../../types'
import { copyComponentProperties } from '../../utils'
import { createUnistylesRef, keyInObject } from '../../web/utils'

type Props = ComponentProps<typeof NativeImage> & {
    style?: UnistylesValues
    imageStyle?: UnistylesValues
}

const UnistylesImage = forwardRef<unknown, Props>((props, forwardedRef) => {
    const classNames = getClassName(props.style)
    const ref = createUnistylesRef(classNames, forwardedRef)
    const hasWidthStyle = typeof props.style === 'object' && keyInObject(props.style, 'width')
    const hasHeightStyle = typeof props.style === 'object' && keyInObject(props.style, 'height')

    maybeWarnAboutMultipleUnistyles(props.style as ViewStyle, 'Image')

    return (
        <NativeImage
            {...props}
            style={[
                classNames,
                // Clear inline width and height extracted from source
                hasWidthStyle && { width: '' },
                hasHeightStyle && { height: '' }
            ] as StyleProp<ImageStyle>}
            ref={ref}
        />
    )
})

export const Image = copyComponentProperties(NativeImage, UnistylesImage)
