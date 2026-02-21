import React, { useId, useLayoutEffect, useRef } from 'react'
import type { ViewStyle } from 'react-native'
import * as unistyles from '../web/services'

type ContainerProviderProps = React.PropsWithChildren<{
    style?: ViewStyle
}>

const ApplyContainerName: React.FunctionComponent<{ name?: string }> = ({ name }) => {
    unistyles.services.shadowRegistry.setContainerName(name)

    useLayoutEffect(() => {
        unistyles.services.shadowRegistry.setContainerName(name)
    })

    return null
}

export const UnistylesBreakpointContainerProvider: React.FunctionComponent<ContainerProviderProps> = ({
    children,
    style
}) => {
    const uniqueId = useId()
    const containerName = useRef(`uni-cq-${uniqueId.replace(/:/g, '')}`).current
    const previousContainerName = unistyles.services.shadowRegistry.getContainerName()

    useLayoutEffect(() => {
        unistyles.services.shadowRegistry.flush()
    })

    const containerStyle: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        containerType: 'inline-size',
        containerName,
        ...(style as React.CSSProperties)
    }

    return (
        <div style={containerStyle}>
            <ApplyContainerName name={containerName} />
            {children}
            <ApplyContainerName name={previousContainerName} />
        </div>
    )
}
