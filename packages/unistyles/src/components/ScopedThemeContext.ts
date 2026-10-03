import { createContext } from 'react'

import type { UnistylesThemes } from '../global'

import { UnistylesShadowRegistry } from '../specs'

type Scope = {
    name: keyof UnistylesThemes | undefined
}

// The nearest ScopedTheme's theme: null outside every ScopedTheme, and { name: undefined } inside `reset`.
// A component that re-renders or mounts on its own renders outside ScopedTheme's render pass, where the shadow
// registry's scoped theme has already been restored, so it reads the theme from here instead.
export const ScopedThemeContext = createContext<Scope | null>(null)

// The scoped theme of a component: the nearest ScopedTheme's, or the registry's outside every ScopedTheme.
export const getScopedThemeName = (scope: Scope | null): string | undefined =>
    scope ? scope.name : UnistylesShadowRegistry.getScopedTheme()

// Runs callback with the registry's scoped theme set to the one scope names, then restores the previous one.
export const withScopedTheme = <T>(scope: Scope | null, callback: () => T): T => {
    if (!scope) {
        return callback()
    }

    const previousScopedTheme = UnistylesShadowRegistry.getScopedTheme()

    UnistylesShadowRegistry.setScopedTheme(scope.name)

    try {
        return callback()
    } finally {
        UnistylesShadowRegistry.setScopedTheme(previousScopedTheme)
    }
}
