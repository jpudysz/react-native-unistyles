import React, { useLayoutEffect, useRef } from 'react'
import { View } from 'react-native'
import type { ViewProps } from 'react-native'
import { UnistylesShadowRegistry } from '../specs'
import { ApplyContainerBreakpoint } from './ApplyContainerBreakpoint'

let nextContainerId = 0

export const UnistylesBreakpointContainerProvider: React.FunctionComponent<React.PropsWithChildren<ViewProps>> = ({
    children,
    onLayout,
    ...props
}) => {
    const containerIdRef = useRef(++nextContainerId)
    const containerId = containerIdRef.current
    const previousContainerId = UnistylesShadowRegistry.getContainerBreakpointId()

    useLayoutEffect(() => {
        UnistylesShadowRegistry.flush()
    })

    const mappedChildren = [
        <ApplyContainerBreakpoint key="apply" containerId={containerId} />,
        children,
        <ApplyContainerBreakpoint key="dispose" containerId={previousContainerId} />
    ]

    return (
        <View
            onLayout={e => {
                const { width, height } = e.nativeEvent.layout

                UnistylesShadowRegistry.updateContainerSize(containerId, width, height)
                onLayout?.(e)
            }}
            {...props}
        >
            {mappedChildren}
        </View>
    )
}
