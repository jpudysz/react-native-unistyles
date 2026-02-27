import { useLayoutEffect } from 'react'
import { UnistylesShadowRegistry } from '../specs'

type ApplyContainerBreakpointProps = {
    containerId?: number
}

export const ApplyContainerBreakpoint: React.FunctionComponent<ApplyContainerBreakpointProps> = ({ containerId }) => {
    UnistylesShadowRegistry.setContainerBreakpointId(containerId)

    useLayoutEffect(() => {
        UnistylesShadowRegistry.setContainerBreakpointId(containerId)
    })

    return null
}
