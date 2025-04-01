import React from 'react'
import type { ViewStyle } from 'react-native'
import type { UnistylesValues } from '../types'
import { copyComponentProperties } from '../utils'
import { createUnistylesRef } from '../web/utils'
import { getClassName } from './getClassname'
import { maybeWarnAboutMultipleUnistyles } from './warn'

type ComponentProps = {
    style?: UnistylesValues | Array<UnistylesValues>
}

export const createUnistylesElement = (Component: any) => {
    const UnistylesComponent = React.forwardRef<unknown, ComponentProps>((props, forwardedRef) => {
        const classNames = getClassName(props.style)
        const ref = createUnistylesRef(classNames, forwardedRef)

        maybeWarnAboutMultipleUnistyles(props.style as ViewStyle, Component.displayName)

        return (
            <Component
                {...props}
                style={classNames}
                ref={ref}
            />
        )
    })

    return copyComponentProperties(Component, UnistylesComponent)
}
