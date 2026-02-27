import React, { useLayoutEffect, useRef } from 'react'
import { View } from 'react-native'
import type { ViewProps } from 'react-native'
import { UnistylesRuntime, UnistylesShadowRegistry } from '../specs'
import { ContainerBreakpointContext, useContainerBreakpointStore } from '../context/ContainerBreakpointContext'
import { ApplyContainerBreakpoint } from './ApplyContainerBreakpoint'
import { getBreakpointFromWidth } from './containerUtils'

let nextContainerId = 0

export const UnistylesBreakpointContainerProvider: React.FunctionComponent<React.PropsWithChildren<ViewProps>> = ({
    children,
    onLayout,
    ...props
}) => {
    const containerIdRef = useRef(++nextContainerId)
    const containerId = containerIdRef.current
    const previousContainerId = UnistylesShadowRegistry.getContainerBreakpointId()
    const { store, emit } = useContainerBreakpointStore()

    useLayoutEffect(() => {
        UnistylesShadowRegistry.flush()
    })

    const mappedChildren = [
        <ApplyContainerBreakpoint key="apply" containerId={containerId} />,
        children,
        <ApplyContainerBreakpoint key="dispose" containerId={previousContainerId} />
    ]

    return (
        <ContainerBreakpointContext.Provider value={store}>
            <View
                onLayout={e => {
                    const { width, height } = e.nativeEvent.layout

                    UnistylesShadowRegistry.updateContainerSize(containerId, width, height)
                    emit(getBreakpointFromWidth(width, UnistylesRuntime.breakpoints))
                    onLayout?.(e)
                }}
                {...props}
            >
                {mappedChildren}
            </View>
        </ContainerBreakpointContext.Provider>
    )
}
