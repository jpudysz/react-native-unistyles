import { useRef } from 'react'
import { unistyles } from './Unistyles'
import type { UnistylesThemes } from './global'

export const useInitialTheme = (forName: keyof UnistylesThemes) => {
    useRef(unistyles.runtime.setTheme(forName))
}
