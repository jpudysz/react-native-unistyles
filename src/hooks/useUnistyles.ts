import { useContext } from 'react'
import { UnistylesContext } from '../UnistylesProvider'
import { useSharedContext } from './useSharedContext'

export const useUnistyles = () => {
    const unistylesContext = useContext(UnistylesContext)
    const { theme, layout, plugins } = useSharedContext({
        useContext: unistylesContext !== undefined,
        deps: unistylesContext ? [unistylesContext] : []
    })

    if (unistylesContext !== undefined) {
        return {
            plugins: unistylesContext.plugins,
            theme: unistylesContext.theme,
            layout: unistylesContext.layout
        }
    }

    return {
        plugins,
        theme,
        layout
    }
}
