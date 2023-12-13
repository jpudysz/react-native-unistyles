import { useMemo } from 'react'
import { unistyles } from '../core'
import type { UnistylesThemes } from '../global'

export const useInitialTheme = (forName: keyof UnistylesThemes) => {
    useMemo(() => {
        if (!unistyles.runtime.themeName) {
            unistyles.runtime.setTheme(forName)
        }
    }, [])
}
