import { useProxifiedUnistyles } from './useProxifiedUnistyles'

export const useUnistyles = () => {
    const { proxifiedRuntime, proxifiedTheme } = useProxifiedUnistyles()

    return {
        theme: proxifiedTheme,
        rt: proxifiedRuntime
    }
}
