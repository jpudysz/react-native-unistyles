import { createContext } from 'react'

import type { UnistylesThemes } from '../global'

export type Scope = {
    name: keyof UnistylesThemes | undefined
}

// React Server Components load a React build without createContext. The Next.js App Router setup
// imports Unistyles from the root layout, a server component, and nothing reads this context there.
export const ScopedThemeContext = (
    typeof createContext === 'function' ? createContext<Scope | null>(null) : null
) as React.Context<Scope | null>
