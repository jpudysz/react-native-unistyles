import { CSSState } from '../web/css/state'
import { UnistylesShadowRegistry } from '../web/shadowRegistry'

jest.mock('../web/services', () => ({}))

describe('ScopedTheme', () => {
    it('scopes theme variables to the ScopedTheme element', () => {
        const css = new CSSState({} as never)

        css.addTheme('dark', { colors: { background: '#000000' } })
        css.addTheme('premium', { colors: { background: '#ff9ff3' } })

        const styles = css.getStyles()

        expect(styles).toContain('[data-unistyles-theme="premium"]{--colors-background:#ff9ff3;}')
        // `reset` follows the theme of the root and the system color scheme
        expect(styles).toContain(':root.premium [data-unistyles-reset]')
        expect(styles).toContain(
            '@media (prefers-color-scheme: dark){:root,[data-unistyles-reset]{--colors-background:#000000;}}',
        )
    })

    it('keeps no scope in the web registry with CSS variables', () => {
        const withCSSVars = new UnistylesShadowRegistry({ state: { CSSVars: true } } as never)
        const withoutCSSVars = new UnistylesShadowRegistry({ state: { CSSVars: false } } as never)

        withCSSVars.setScopedTheme('dark' as never)
        withoutCSSVars.setScopedTheme('dark' as never)

        expect(withCSSVars.getScopedTheme()).toBeUndefined()
        expect(withoutCSSVars.getScopedTheme()).toBe('dark')
    })
})
