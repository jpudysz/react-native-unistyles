import { CSSState } from '../web/css/state'
import { UnistylesState } from '../web/state'

type DOM = { window: Window & typeof globalThis }

// The React Native preset can't run in the jsdom environment, so the test brings its own document
const { JSDOM } = jest.requireActual('jsdom') as { JSDOM: new (html: string) => DOM }

jest.mock('../web/services', () => ({}))

const THEME_CSS = ':root.light{--color:red;}'
const SERVER_CSS = `${THEME_CSS}.unistyles_abc{color:red;}`

const getTag = () => document.getElementById('unistyles-web') as HTMLStyleElement
const getRules = () => Array.from((getTag().sheet as CSSStyleSheet).cssRules, (rule) => rule.cssText).join('')
const createServices = (css: CSSState) =>
    ({
        registry: { css },
        runtime: {},
        listener: { initListeners: () => {} },
    }) as never

describe('Server rendered page in the browser', () => {
    beforeEach(() => {
        const { window } = new JSDOM(
            `<head><style id="unistyles-web">${SERVER_CSS}</style><script id="unistyles-script"></script></head>`,
        )

        Object.assign(window, {
            __UNISTYLES_STATE__: {
                mainState: [['', [['unistyles_abc', [['color', 'red']]]]]],
                mqState: [],
            },
        })
        Object.assign(globalThis, { window, document: window.document })
    })

    afterEach(() => {
        // @ts-expect-error cleanup of browser globals
        delete globalThis.window
        // @ts-expect-error cleanup of browser globals
        delete globalThis.document
    })

    it('keeps the styles rendered by the server until the themes are added', () => {
        expect(new CSSState({} as never).getStyles()).toBe('')
        expect(getTag().textContent).toBe(SERVER_CSS)
        expect(document.getElementById('unistyles-script')).not.toBeNull()
    })

    it('takes over the styles rendered by the server once configured, without hydrateServerUnistyles', () => {
        const css = new CSSState({} as never)
        const state = new UnistylesState(createServices(css))
        const hydrate = css.hydrate
        let stylesWhenHydrating = ''

        css.hydrate = (serverState) => {
            stylesWhenHydrating = css.getStyles()
            hydrate(serverState)
        }
        state.init({ themes: { light: { color: 'red' } } } as never)

        // Hydrating clears the server's text, its themes included: the browser's must already be there
        expect(stylesWhenHydrating).toContain('--color:red;')
        expect(getTag().textContent).toBe('')
        expect(getRules()).toContain('--color: red')
        expect(getRules()).toContain('.unistyles_abc')
        expect(css.getStyles()).toContain('.unistyles_abc{color:red;}')
        expect(document.getElementById('unistyles-script')).toBeNull()
    })

    it('leaves a page the server did not render alone', () => {
        const window = globalThis.window as Window & { __UNISTYLES_STATE__?: unknown }

        delete window.__UNISTYLES_STATE__

        const css = new CSSState({} as never)

        css.hydrateFromServer()

        expect(getTag().textContent).toBe(SERVER_CSS)
        expect(document.getElementById('unistyles-script')).not.toBeNull()
    })
})
