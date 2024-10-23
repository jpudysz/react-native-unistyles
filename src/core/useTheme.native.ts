import { useEffect, useState } from 'react'
import { StyleSheet, UnistyleDependency, UnistylesRuntime } from '../specs'

export const useTheme = () => {
    const [theme, setTheme] = useState(UnistylesRuntime.getTheme())

    useEffect(() => {
        const removeChangeListener = StyleSheet.addChangeListener(dependencies => {
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
