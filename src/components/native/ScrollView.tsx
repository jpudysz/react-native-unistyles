import React from 'react'
import { forwardRef } from 'react'
import { ScrollView as NativeScrollView, type StyleProp, type ViewStyle } from 'react-native'
import { getClassName } from '../../core'
import { maybeWarnAboutMultipleUnistyles } from '../../core/warn'
import type { UnistylesValues } from '../../types'
import { copyComponentProperties } from '../../utils'
import { isServer } from '../../web/utils'
import { createUnistylesRef } from '../../web/utils/createUnistylesRef'

type Props = {
    style?: UnistylesValues
    contentContainerStyle?: UnistylesValues
}

const UnistylesScrollView = forwardRef<unknown, Props>((props, forwardedRef) => {
    const styleClassNames = getClassName(props.style)
    const contentContainerStyleClassNames = getClassName(props.contentContainerStyle)
    const ref = createUnistylesRef(styleClassNames, forwardedRef)
    const contentContainerRef = createUnistylesRef(contentContainerStyleClassNames)

    maybeWarnAboutMultipleUnistyles(props.style as ViewStyle, 'ScrollView')
    maybeWarnAboutMultipleUnistyles(props.contentContainerStyle as ViewStyle, 'ScrollView')

    return (
        <NativeScrollView
            {...props}
            style={styleClassNames as StyleProp<ViewStyle>}
            contentContainerStyle={contentContainerStyleClassNames as StyleProp<ViewStyle>}
            ref={isServer() ? undefined : scrollRef => {
                ref?.(scrollRef)
                contentContainerRef?.(scrollRef)
            }}
        />
    )
})

export const ScrollView = copyComponentProperties(NativeScrollView, UnistylesScrollView)
