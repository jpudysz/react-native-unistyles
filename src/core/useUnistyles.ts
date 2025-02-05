import type { UnistylesTheme } from '../types'
import { useProxifiedUnistyles } from './useProxifiedUnistyles'

export const useUnistyles = () => {
    const { proxifiedRuntime, proxifiedTheme } = useProxifiedUnistyles()

    return {
        theme: proxifiedTheme as UnistylesTheme,
        rt: proxifiedRuntime
    }
}
