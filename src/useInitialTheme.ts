import { useMemo } from 'react'
import { unistyles } from './Unistyles'
import type { UnistylesThemes } from './global'

export const useInitialTheme = (forName: keyof UnistylesThemes) => {
    useMemo(() => unistyles.runtime.setTheme(forName), [])
}
