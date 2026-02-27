import { useContainerBreakpoint } from '../context/ContainerBreakpointContext'
import type { UnistylesTheme } from '../types'

import { useProxifiedUnistyles } from './useProxifiedUnistyles'

export const useUnistyles = () => {
    const { proxifiedRuntime, proxifiedTheme } = useProxifiedUnistyles()
    const containerBreakpoint = useContainerBreakpoint()

    return {
        theme: proxifiedTheme as UnistylesTheme,
        rt: proxifiedRuntime,
        containerBreakpoint,
    }
}
