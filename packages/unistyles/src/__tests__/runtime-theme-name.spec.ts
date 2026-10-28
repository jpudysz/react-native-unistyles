import { UnistyleDependency } from '../specs/NativePlatform/NativePlatform.nitro'
import { UnistylesRegistry } from '../web/registry'
import { UnistylesRuntime } from '../web/runtime'
import { UnistylesShadowRegistry } from '../web/shadowRegistry'

jest.mock('../web/services', () => ({}))

const lightTheme = { name: 'light' }
const darkTheme = { name: 'dark' }
const premiumTheme = { name: 'premium' }

type Read = { theme: object; themeName?: string }
type Options = { hasAdaptiveThemes?: boolean }

// Web services without CSS variables, the only mode that keeps a scope in the registry
const createServices = ({ hasAdaptiveThemes = false }: Options = {}) => {
    // shadow registry listeners rebuild the styles of views, registry listeners the cached app StyleSheets
    const viewListeners: Array<VoidFunction> = []
    const stylesheetListeners: Array<VoidFunction> = []
    const services = {
        state: {
            CSSVars: false,
            hasAdaptiveThemes,
            themeName: 'dark',
            themes: new Map<string, object>([
                ['light', lightTheme],
                ['dark', darkTheme],
                ['premium', premiumTheme],
            ]),
        },
        listener: {
            emitChange: jest.fn(),
            emitChanges: jest.fn(),
            addListeners: jest.fn((_dependencies: Array<UnistyleDependency>, listener: VoidFunction) => {
                viewListeners.push(listener)

                return () => {}
            }),
            addStylesheetListeners: jest.fn((_dependencies: Array<UnistyleDependency>, listener: VoidFunction) => {
                stylesheetListeners.push(listener)

                return () => {}
            }),
        },
    } as Record<string, any>

    services.shadowRegistry = new UnistylesShadowRegistry(services as never)
    services.runtime = new UnistylesRuntime(services as never)
    services.registry = new UnistylesRegistry(services as never)
    // CSS output isn't checked here, only what the StyleSheet is called with
    services.registry.applyStyles = jest.fn()
    // what the listeners do after a dependency changes, outside of render
    services.emitViews = () => viewListeners.forEach((listener) => listener())
    services.emitStyleSheets = () => stylesheetListeners.forEach((listener) => listener())
    // the web listener runs StyleSheet listeners before the ones of views
    services.emit = () => {
        services.emitStyleSheets()
        services.emitViews()
    }

    return services
}

// Records the theme and rt.themeName every call of the StyleSheet got
const createStyleSheet = () => {
    const reads: Array<Read> = []
    const stylesheet = jest.fn((theme: object, rt: { themeName?: string }) => {
        reads.push({ theme, themeName: rt.themeName })

        return { box: { theme, themeName: rt.themeName } }
    })

    return { stylesheet, reads, lastRead: () => reads.at(-1) }
}

const mockBrowser = (scheme: 'light' | 'dark') => {
    const root = { classList: { add: jest.fn(), remove: jest.fn() } }

    Object.assign(globalThis, {
        window: {
            matchMedia: (query: string) => ({ matches: query === `(prefers-color-scheme: ${scheme})` }),
        },
        document: {
            querySelector: () => root,
            documentElement: {},
            // the style tag rendered by SSR, so the registry doesn't create one
            getElementById: () => ({}),
        },
    })

    return root
}

describe('UnistylesRuntime.themeName and ScopedTheme (#1295)', () => {
    describe('runtime', () => {
        afterEach(() => {
            // @ts-expect-error cleanup of browser globals
            delete globalThis.window
            // @ts-expect-error cleanup of browser globals
            delete globalThis.document
        })

        it('returns the app theme without a scope', () => {
            const { runtime } = createServices()

            expect(runtime.themeName).toBe('dark')
            expect(runtime.getTheme()).toBe(darkTheme)
        })

        it('returns the app theme while a ScopedTheme renders, like getTheme()', () => {
            const { runtime, shadowRegistry } = createServices()

            shadowRegistry.setScopedTheme('light')

            expect(runtime.themeName).toBe('dark')
            expect(runtime.theme).toBe(darkTheme)
            expect(runtime.getTheme()).toBe(darkTheme)
            expect(runtime.miniRuntime.themeName).toBe('dark')
        })

        it('returns the app theme inside nested scopes and a reset scope', () => {
            const { runtime, shadowRegistry } = createServices()

            for (const scope of ['light', 'premium', undefined]) {
                shadowRegistry.setScopedTheme(scope)

                expect(runtime.themeName).toBe('dark')
            }
        })

        it('follows the color scheme with adaptive themes, not the scope', () => {
            mockBrowser('light')

            const { runtime, shadowRegistry } = createServices({ hasAdaptiveThemes: true })

            shadowRegistry.setScopedTheme('dark')

            expect(runtime.themeName).toBe('light')
            expect(runtime.getTheme()).toBe(lightTheme)
        })

        it('builds the mini runtime for the theme a StyleSheet is called with', () => {
            const { runtime, shadowRegistry } = createServices()

            shadowRegistry.setScopedTheme('light')

            expect(runtime.getMiniRuntime('premium').themeName).toBe('premium')
            expect(runtime.getMiniRuntime(undefined).themeName).toBeUndefined()
        })

        it('changes the app theme to the name of a scope left in the registry', () => {
            const { runtime, shadowRegistry, state, listener } = createServices()

            // eg. a suspended <ScopedTheme name="light"> never restores the previous scope
            shadowRegistry.setScopedTheme('light')
            runtime.setTheme('light')

            expect(state.themeName).toBe('light')
            expect(listener.emitChanges).toHaveBeenCalledWith([UnistyleDependency.Theme, UnistyleDependency.ThemeName])
        })

        it("doesn't emit changes for the current app theme while another scope is in the registry", () => {
            const { runtime, shadowRegistry, state, listener } = createServices()

            shadowRegistry.setScopedTheme('light')
            runtime.setTheme('dark')

            expect(state.themeName).toBe('dark')
            expect(listener.emitChanges).not.toHaveBeenCalled()
        })

        it('marks the root with the app theme when adaptive themes are disabled while a scope is in the registry', () => {
            const root = mockBrowser('dark')
            const { runtime, shadowRegistry } = createServices({ hasAdaptiveThemes: true })

            shadowRegistry.setScopedTheme('light')
            runtime.setAdaptiveThemes(false)

            expect(root.classList.add).toHaveBeenCalledWith('dark')
            expect(root.classList.add).not.toHaveBeenCalledWith('light')
        })
    })

    describe('registry', () => {
        it('calls a scoped StyleSheet with the scoped theme name outside of render', () => {
            const { registry } = createServices()
            const { stylesheet, lastRead } = createStyleSheet()

            // a listener rebuilds scoped styles after the ScopedTheme rendered, the registry has no scope
            registry.getComputedStylesheet(stylesheet, 'light')

            expect(lastRead()).toEqual({ theme: lightTheme, themeName: 'light' })
        })

        it('calls a scoped StyleSheet with its own scope when another one is in the registry', () => {
            const { registry, shadowRegistry } = createServices()
            const { stylesheet, lastRead } = createStyleSheet()

            shadowRegistry.setScopedTheme('premium')
            registry.getComputedStylesheet(stylesheet, 'light')

            expect(lastRead()).toEqual({ theme: lightTheme, themeName: 'light' })
        })

        it('calls an unscoped StyleSheet with the app theme while a scope is left in the registry', () => {
            const { registry, shadowRegistry } = createServices()
            const { stylesheet, lastRead } = createStyleSheet()

            shadowRegistry.setScopedTheme('light')
            registry.getComputedStylesheet(stylesheet)

            expect(lastRead()).toEqual({ theme: darkTheme, themeName: 'dark' })
        })

        it("doesn't cache a scoped call as the app StyleSheet", () => {
            const { registry } = createServices()
            const { stylesheet } = createStyleSheet()

            registry.getComputedStylesheet(stylesheet, 'light')

            expect(registry.getComputedStylesheet(stylesheet).box).toEqual({ theme: darkTheme, themeName: 'dark' })
        })

        it('rebuilds an unscoped StyleSheet with the new app theme while a scope is left in the registry', () => {
            const services = createServices()
            const { stylesheet } = createStyleSheet()

            services.registry.getComputedStylesheet(stylesheet)
            services.state.themeName = 'premium'
            services.shadowRegistry.setScopedTheme('light')
            services.emitStyleSheets()

            expect(services.registry.getComputedStylesheet(stylesheet).box).toEqual({
                theme: premiumTheme,
                themeName: 'premium',
            })
        })
    })

    describe('shadow registry', () => {
        const createStyle = (stylesheet: ReturnType<typeof createStyleSheet>['stylesheet']) => ({
            unistyles_box: { __uni__key: 'box', __uni__stylesheet: stylesheet, __uni__args: [] },
        })

        it('keeps the scoped theme and rt.themeName when a dependency change rebuilds the style', () => {
            const services = createServices()
            const { stylesheet, reads } = createStyleSheet()

            // <ScopedTheme name="light"> renders the view
            services.shadowRegistry.setScopedTheme('light')
            services.shadowRegistry.addStyles([createStyle(stylesheet)])
            services.shadowRegistry.setScopedTheme(undefined)

            // the app theme changes later, outside of render
            reads.length = 0
            services.state.themeName = 'premium'
            services.emitViews()

            // the cached app StyleSheet can follow the app theme, the scoped view can't
            expect(reads).toEqual([{ theme: lightTheme, themeName: 'light' }])
        })

        it('keeps the app theme for a view outside of any scope when a scope is left in the registry', () => {
            const services = createServices()
            const { stylesheet, lastRead } = createStyleSheet()

            services.shadowRegistry.addStyles([createStyle(stylesheet)])
            services.shadowRegistry.setScopedTheme('light')
            services.state.themeName = 'premium'
            services.emit()

            expect(lastRead()).toEqual({ theme: premiumTheme, themeName: 'premium' })
        })
    })
})
