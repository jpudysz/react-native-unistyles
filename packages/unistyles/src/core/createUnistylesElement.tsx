import type { ViewStyle } from 'react-native'

import React from 'react'

import type { UnistylesValues } from '../types'

import { copyComponentProperties } from '../utils'
import { useUnistylesRef } from '../web/utils/createUnistylesRef'
import { getClassName } from './getClassname'
import { maybeWarnAboutMultipleUnistyles } from './warn'

const STYLE_PROPS = ['contentContainerStyle', 'columnWrapperStyle'] as const

type StyleProp = (typeof STYLE_PROPS)[number] | 'style'

type ComponentProps = {
    [K in StyleProp]?: UnistylesValues
}

const buildUnistylesProps = (Component: any, props: ComponentProps) => {
    const componentStyleProps = ['style' as const, ...STYLE_PROPS.filter((styleProp) => styleProp in props)]
    const classNames = Object.fromEntries(
        componentStyleProps.map((styleProp) => [styleProp, getClassName(props[styleProp])]),
    )

    componentStyleProps.forEach((styleProp) => {
        maybeWarnAboutMultipleUnistyles(props[styleProp] as ViewStyle, Component.displayName)
    })

    return classNames
}

export const createUnistylesElement = (Component: any) => {
    const UnistylesComponent = ({ ref, ...props }: any) => {
        const classNames = buildUnistylesProps(Component, props)
        const unistylesRef = useUnistylesRef(
            Object.values(classNames).map((className) => className?.[0].hash),
            ref,
        )

        return <Component {...props} {...classNames} ref={unistylesRef} />
    }

    return copyComponentProperties(Component, UnistylesComponent)
}
