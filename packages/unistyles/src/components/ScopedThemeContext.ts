import { createContext } from 'react'

import type { UnistylesThemes } from '../global'

export type Scope = {
    name: keyof UnistylesThemes | undefined
}

export const ScopedThemeContext = createContext<Scope | null>(null)
