import React from 'react'
import { renderToString } from 'react-dom/server'

import { UnistylesRuntime } from '../web/runtime'

jest.mock('../web/services', () => ({}))

const light = { colors: { background: '#fff' } }
const dark = { colors: { background: '#000' } }
const lightVars = { colors: { background: 'var(--colors-background)' } }

// A browser with a dark color scheme, a wide window and a breakpoint, while hydrating a page the server rendered
const mockRuntime = ({ hasAdaptiveThemes = true, CSSVars = true, themeName = 'dark', serverThemeName = 'light' }) => {
    Object.assign(globalThis, {
        window: {
            matchMedia: (query: string) => ({ matches: query === '(prefers-color-scheme: dark)' }),
            devicePixelRatio: 2,
            innerWidth: 1280,
            innerHeight: 800,
            __UNISTYLES_STATE__: { mainState: [], mqState: [], themeName: serverThemeName },
        },
        document: {
            querySelector: () => null,
            documentElement: { dir: 'ltr' },
        },
        screen: { orientation: { type: 'landscape-primary' } },
    })

    return new UnistylesRuntime({
        state: {
            hasAdaptiveThemes,
            CSSVars,
            themeName,
            breakpoint: 'md',
            themes: new Map([
                ['light', light],
                ['dark', dark],
            ]),
            cssThemes: CSSVars
                ? new Map([
                      ['light', lightVars],
                      ['dark', lightVars],
                  ])
                : new Map(),
        },
        shadowRegistry: { getScopedTheme: () => undefined },
    } as never)
}

let mockRuntimeInstance: UnistylesRuntime

jest.mock('../specs', () => ({
    get UnistylesRuntime() {
        return mockRuntimeInstance
    },
}))
jest.mock('../core/useProxifiedUnistyles/listener', () => ({ listener: () => () => {} }))

// Required after the mocks
const { useProxifiedUnistyles } =
    require('../core/useProxifiedUnistyles') as typeof import('../core/useProxifiedUnistyles')

const Probe = () => {
    const { proxifiedRuntime: rt, proxifiedTheme: theme } = useProxifiedUnistyles()

    return (
        <span>
            {JSON.stringify({
                background: (theme as unknown as typeof light).colors.background,
                themeName: rt.themeName,
                colorScheme: rt.colorScheme,
                breakpoint: rt.breakpoint ?? null,
                width: rt.screen.width,
                rtl: rt.rtl,
            })}
        </span>
    )
}

const render = () =>
    JSON.parse(
        renderToString(<Probe />)
            .replace(/^<span>|<\/span>$/g, '')
            .replace(/&quot;/g, '"'),
    )

describe('Server rendered page in the browser, while hydrating', () => {
    afterEach(() => {
        // @ts-expect-error cleanup of browser globals
        delete globalThis.window
        // @ts-expect-error cleanup of browser globals
        delete globalThis.document
        // @ts-expect-error cleanup of browser globals
        delete globalThis.screen
    })

    it('gives useUnistyles the values the server rendered with, not the browser ones', () => {
        mockRuntimeInstance = mockRuntime({})

        expect(render()).toEqual({
            background: 'var(--colors-background)',
            themeName: 'light',
            colorScheme: 'unspecified',
            breakpoint: null,
            width: 0,
            rtl: true,
        })
    })

    it("gives the server theme's values when CSS variables are off", () => {
        mockRuntimeInstance = mockRuntime({ CSSVars: false })

        expect(render().background).toBe('#fff')
    })

    it('takes the theme the server rendered with, without adaptive themes', () => {
        mockRuntimeInstance = mockRuntime({
            hasAdaptiveThemes: false,
            CSSVars: false,
            themeName: 'dark',
            serverThemeName: 'light',
        })

        expect(render()).toMatchObject({ background: '#fff', themeName: 'light' })
    })

    it('gives the browser values once hydrated', () => {
        mockRuntimeInstance = mockRuntime({})

        expect(mockRuntimeInstance.miniRuntime).toMatchObject({
            themeName: 'dark',
            colorScheme: 'dark',
            breakpoint: 'md',
            screen: { width: 1280, height: 800 },
            rtl: false,
        })
    })
})
