import { useEffect, useState } from 'react'
import { StyleSheet, UnistyleDependency, UnistylesRuntime } from '../specs'

export const useBreakpoint = () => {
    const [breakpoint, setBreakpoint] = useState(UnistylesRuntime.breakpoint)

    useEffect(() => {
        const removeChangeListener = StyleSheet.addChangeListener(dependencies => {
            if (dependencies.includes(UnistyleDependency.Breakpoints)) {
                setBreakpoint(UnistylesRuntime.breakpoint)
            }
        })

        return () => {
            removeChangeListener()
        }
    }, [])

    return breakpoint
}
