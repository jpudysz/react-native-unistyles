import { useEffect, useState } from 'react'
import { StyleSheet, UnistyleDependency, UnistylesRuntime } from '../specs'
import type { UnistylesStyleSheet } from '../specs'
import type { UnistylesTheme } from '../types'

export const useTheme = (): UnistylesTheme => {
    const [theme, setTheme] = useState(UnistylesRuntime.getTheme())

    useEffect(() => {
        const removeChangeListener = (StyleSheet as UnistylesStyleSheet).addChangeListener(dependencies => {
            if (dependencies.includes(UnistyleDependency.Theme)) {
                setTheme(UnistylesRuntime.getTheme())
            }
        })

        return () => {
            removeChangeListener()
        }
    }, [])

    return theme
}
