import { useEffect, useState } from 'react'
import { StyleSheet, UnistyleDependency, UnistylesRuntime } from '../specs'
import type { UnistylesStyleSheet } from '../specs'

export const useBreakpoint = () => {
    const [breakpoint, setBreakpoint] = useState(UnistylesRuntime.breakpoint)

    useEffect(() => {
        const removeChangeListener = (StyleSheet as UnistylesStyleSheet).addChangeListener(dependencies => {
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
