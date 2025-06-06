import React from 'react'
import type { ViewStyle } from 'react-native'
import type { UnistylesValues } from '../types'
import { copyComponentProperties } from '../utils'
import { isServer } from '../web/utils'
import { createUnistylesRef } from '../web/utils/createUnistylesRef'
import { getClassName } from './getClassname'
import { maybeWarnAboutMultipleUnistyles } from './warn'

const STYLE_PROPS = ['style', 'contentContainerStyle', 'columnWrapperStyle'] as const

type ComponentProps = {
    [K in typeof STYLE_PROPS[number]]?: UnistylesValues
}

const buildUnistylesProps = (Component: any, props: ComponentProps, forwardedRef: React.ForwardedRef<unknown>) => {
    const componentStyleProps = STYLE_PROPS.filter(styleProp => styleProp in props)
    const classNames = Object.fromEntries(componentStyleProps.map(styleProp => [styleProp, getClassName(props[styleProp])]))
    const refs = componentStyleProps.map(styleProp => {
        return createUnistylesRef(
            classNames[styleProp],
            styleProp === 'style' ? forwardedRef : undefined
        )
    })

    componentStyleProps.forEach(styleProp => {
        maybeWarnAboutMultipleUnistyles(props[styleProp] as ViewStyle, Component.displayName)
    })

    return {
        ...classNames,
        ref: isServer() ? undefined : (componentRef: any) => refs.forEach(ref => ref?.(componentRef))
    }
}

export const createUnistylesElement = (Component: any) => {
    const UnistylesComponent = (props: any) => {
        return (
            <Component
                {...props}
                {...buildUnistylesProps(Component, props, props.ref)}
            />
        )
    }

    return copyComponentProperties(Component, UnistylesComponent)
}
