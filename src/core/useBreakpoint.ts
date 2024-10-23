import { useEffect, useState } from 'react'
import { UnistylesRuntime } from '../web'
import { UnistylesListener } from '../web/listener'
import { UnistyleDependency } from '../specs'

export const useBreakpoint = () => {
    const [breakpoint, setBreakpoint] = useState(UnistylesRuntime.breakpoint)

    useEffect(() => {
        const removeChangeListener = UnistylesListener.addListeners([UnistyleDependency.Breakpoints], () => setBreakpoint(UnistylesRuntime.breakpoint))

        return () => {
            removeChangeListener()
        }
    }, [])

    return breakpoint
}
