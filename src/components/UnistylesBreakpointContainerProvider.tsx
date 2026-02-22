import React, { useId, useLayoutEffect, useRef } from 'react'
import type { ViewStyle } from 'react-native'
import * as unistyles from '../web/services'
import { ContainerBreakpointContext, useContainerBreakpointStore } from '../context/ContainerBreakpointContext'
import { getBreakpointFromWidth } from './containerUtils'

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
    const containerRef = useRef<HTMLDivElement>(null)
    const { store, emit } = useContainerBreakpointStore()
    const breakpoints = (unistyles.services.runtime.breakpoints ?? {}) as Record<string, number | undefined>

    useLayoutEffect(() => {
        unistyles.services.shadowRegistry.flush()
    })

    useLayoutEffect(() => {
        const element = containerRef.current

        if (!element) {
            return
        }

        const { width } = element.getBoundingClientRect()

        emit(getBreakpointFromWidth(width, breakpoints))

        const observer = new ResizeObserver(entries => {
            const entry = entries[0]

            if (!entry) {
                return
            }

            emit(getBreakpointFromWidth(entry.contentRect.width, breakpoints))
        })

        observer.observe(element)

        return () => observer.disconnect()
    }, [])

    const containerStyle: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        containerType: 'inline-size',
        containerName,
        ...(style as React.CSSProperties)
    }

    return (
        <ContainerBreakpointContext.Provider value={store}>
            <div ref={containerRef} style={containerStyle}>
                <ApplyContainerName name={containerName} />
                {children}
                <ApplyContainerName name={previousContainerName} />
            </div>
        </ContainerBreakpointContext.Provider>
    )
}
