import type { Scope } from '../../components/ScopedThemeContext'
import type { StyleSource } from '../../unifiber/src'

import { ScopedThemeContext } from '../../components/ScopedThemeContext'

type ScopedThemeAccess = {
    get(): string | undefined
    set(name: string | undefined): void
}

export const createUnistylesStyleSource = (scopedTheme: ScopedThemeAccess) => {
    let epoch = 0
    let warned = false

    const source: StyleSource = {
        name: 'unistyles',
        epoch: () => epoch,
        contexts: [ScopedThemeContext],
        contextKey: (_context, scope) => (scope as Scope | null)?.name,
        resolve: (props, read) => {
            try {
                return resolveFresh(props, read(ScopedThemeContext))
            } catch (error) {
                if (!warned) {
                    warned = true
                    console.warn(`Unistyles: Could not refresh styles for a CSS transition. ${String(error)}`)
                }

                return undefined
            }
        },
    }

    const resolveFresh = (props: Record<string, any>, scope: Scope | null | undefined) => {
        const styles = [props.style].flat(Infinity)
        const fresh: Record<string, unknown> = {}
        let hasUnistyles = false

        for (const style of styles) {
            if (!style || typeof style !== 'object') {
                continue
            }

            Object.assign(fresh, style)

            for (const key in style) {
                if (!key.startsWith('unistyles_') || !Object.prototype.hasOwnProperty.call(style, key)) {
                    continue
                }

                hasUnistyles = true

                const previousScopedTheme = scope ? scopedTheme.get() : undefined

                if (scope) {
                    scopedTheme.set(scope.name)
                }

                try {
                    Object.assign(fresh, style[key]?.uni__getStyles?.())
                } finally {
                    if (scope) {
                        scopedTheme.set(previousScopedTheme)
                    }
                }
            }
        }

        return hasUnistyles ? fresh : undefined
    }

    return {
        source,
        bumpEpoch: () => {
            epoch++
        },
    }
}
