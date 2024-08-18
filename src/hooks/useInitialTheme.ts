import { useMemo } from 'react'
import { UnistylesRuntime } from '../specs'
import type { UnistylesThemes } from '../global'

export const useInitialTheme = (forName: keyof UnistylesThemes) => {
    useMemo(() => {
        if (!UnistylesRuntime.themeName) {
            UnistylesRuntime.setTheme(forName)
        }
    }, [])
}
