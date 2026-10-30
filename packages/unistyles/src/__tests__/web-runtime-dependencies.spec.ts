import type { UnistylesMiniRuntime } from '../specs'

import { UnistyleDependency } from '../specs/NativePlatform/NativePlatform.nitro'
import { createTrackedMiniRuntime, trackDependencies } from '../web/dependencyTracker'
import { UnistylesRegistry } from '../web/registry'
import { UnistylesRuntime } from '../web/runtime'
import { UnistylesShadowRegistry } from '../web/shadowRegistry'

jest.mock('../web/services', () => ({}))
// what react-native-unistyles/metro resolves, there is no Babel plugin
jest.mock('../core/trackDependencies', () => ({ TRACK_DEPENDENCIES: true }))

type Listener = { dependencies: Array<UnistyleDependency>; listener: VoidFunction; disposed: boolean }

const theme = { colors: { primary: 'red' } }

const createServices = ({ CSSVars = false } = {}) => {
    const viewListeners: Array<Listener> = []
    const stylesheetListeners: Array<Listener> = []
    const register = (listeners: Array<Listener>) =>
        jest.fn((dependencies: Array<UnistyleDependency>, listener: VoidFunction) => {
            const entry = { dependencies, listener, disposed: false }

            listeners.push(entry)

            return () => {
                entry.disposed = true
            }
        })
    const services = {
        state: {
            CSSVars,
            hasAdaptiveThemes: false,
            themeName: 'light',
            themes: new Map<string, object>([['light', theme]]),
            cssThemes: new Map<string, object>([['light', theme]]),
        },
        listener: {
            emitChange: jest.fn(),
            emitChanges: jest.fn(),
            addListeners: register(viewListeners),
            addStylesheetListeners: register(stylesheetListeners),
        },
    } as Record<string, any>

    services.shadowRegistry = new UnistylesShadowRegistry(services as never)
    services.runtime = new UnistylesRuntime(services as never)
    services.registry = new UnistylesRegistry(services as never)
    services.registry.applyStyles = jest.fn()

    const active = (listeners: Array<Listener>) => listeners.filter((entry) => !entry.disposed)

    // like the web listener, StyleSheet listeners run before the ones of views
    services.emit = (dependency: UnistyleDependency) => {
        active(stylesheetListeners)
            .filter((entry) => entry.dependencies.includes(dependency))
            .forEach((entry) => entry.listener())
        active(viewListeners)
            .filter((entry) => entry.dependencies.includes(dependency))
            .forEach((entry) => entry.listener())
    }
    services.viewDependencies = () => active(viewListeners).map((entry) => [...entry.dependencies].sort())
    services.stylesheetDependencies = () => active(stylesheetListeners).map((entry) => [...entry.dependencies].sort())

    return services
}

const createStyle = (stylesheet: unknown, key: string, args: Array<unknown> = []) => ({
    [`unistyles_${key}`]: { __uni__key: key, __uni__stylesheet: stylesheet, __uni__args: args },
})

const sorted = (...dependencies: Array<UnistyleDependency>) => dependencies.sort()

describe('web dependencies without the Babel plugin', () => {
    describe('createTrackedMiniRuntime', () => {
        const miniRuntime = {
            screen: { width: 400, height: 800 },
            insets: { top: 10, bottom: 20, left: 0, right: 0, ime: 0 },
            fontScale: 2,
            isPortrait: true,
        } as unknown as UnistylesMiniRuntime

        it('records the dependency of every read property', () => {
            const rt = createTrackedMiniRuntime(miniRuntime)
            const { result, dependencies } = trackDependencies(() => rt.screen.width * rt.fontScale)

            expect(result).toBe(800)
            expect(dependencies).toEqual([UnistyleDependency.Dimensions, UnistyleDependency.FontScale])
        })

        it('records ime apart from the other insets', () => {
            const rt = createTrackedMiniRuntime(miniRuntime)

            expect(trackDependencies(() => rt.insets.ime).dependencies).toEqual([UnistyleDependency.Ime])
            expect(trackDependencies(() => rt.insets.top).dependencies).toEqual([UnistyleDependency.Insets])
            expect(trackDependencies(() => ({ ...rt.insets })).dependencies.sort()).toEqual(
                sorted(UnistyleDependency.Insets, UnistyleDependency.Ime),
            )
        })

        it('records destructured properties', () => {
            const rt = createTrackedMiniRuntime(miniRuntime)
            const { dependencies } = trackDependencies(() => {
                const {
                    isPortrait,
                    insets: { bottom },
                } = rt

                return isPortrait ? bottom : 0
            })

            expect(dependencies).toEqual([UnistyleDependency.Orientation, UnistyleDependency.Insets])
        })

        it('ignores reads outside of a tracked call and keeps values', () => {
            const rt = createTrackedMiniRuntime(miniRuntime)

            expect(rt.screen).toBe(miniRuntime.screen)
            expect(rt.insets).toBe(rt.insets)
            expect(trackDependencies(() => 1).dependencies).toEqual([])
        })

        it('records only into the innermost call', () => {
            const rt = createTrackedMiniRuntime(miniRuntime)
            let inner: Array<UnistyleDependency> = []
            const outer = trackDependencies(() => {
                inner = trackDependencies(() => rt.fontScale).dependencies

                return rt.screen
            })

            expect(inner).toEqual([UnistyleDependency.FontScale])
            expect(outer.dependencies).toEqual([UnistyleDependency.Dimensions])
        })
    })

    describe('registry', () => {
        it('listens to what the StyleSheet reads and to the theme', () => {
            const services = createServices()
            const stylesheet = (t: typeof theme, rt: UnistylesMiniRuntime) => ({
                box: { color: t.colors.primary, width: rt.screen.width },
            })

            services.registry.getComputedStylesheet(stylesheet)

            expect(services.stylesheetDependencies()).toEqual([
                sorted(UnistyleDependency.Theme, UnistyleDependency.Dimensions),
            ])
            expect(services.registry.getStylesheetDependencies(stylesheet).sort()).toEqual(
                sorted(UnistyleDependency.Theme, UnistyleDependency.Dimensions),
            )
        })

        it('picks up a dependency read behind a condition', () => {
            const services = createServices()
            let compact = false
            const stylesheet = (_: typeof theme, rt: UnistylesMiniRuntime) => ({
                box: { paddingTop: compact ? 0 : rt.insets.top, fontSize: rt.fontScale * 10 },
            })

            services.registry.getComputedStylesheet(stylesheet)
            compact = true
            services.emit(UnistyleDependency.FontScale)

            expect(services.registry.getStylesheetDependencies(stylesheet).sort()).toEqual(
                sorted(UnistyleDependency.Theme, UnistyleDependency.Insets, UnistyleDependency.FontScale),
            )

            const conditional = (_: typeof theme, rt: UnistylesMiniRuntime) => ({
                box: { paddingTop: compact ? rt.insets.top : 0, fontSize: rt.fontScale * 10 },
            })

            compact = false
            services.registry.getComputedStylesheet(conditional)
            expect(services.registry.getStylesheetDependencies(conditional)).not.toContain(UnistyleDependency.Insets)

            compact = true
            services.emit(UnistyleDependency.FontScale)

            expect(services.registry.getStylesheetDependencies(conditional)).toContain(UnistyleDependency.Insets)
        })

        it('forgets the dependencies on reset, eg. between server renders', () => {
            const services = createServices()
            const stylesheet = (_: typeof theme, rt: UnistylesMiniRuntime) => ({ box: { width: rt.screen.width } })

            services.registry.getComputedStylesheet(stylesheet)
            services.registry.reset()

            expect(services.registry.getStylesheetDependencies(stylesheet)).toEqual([])
        })
    })

    describe('shadow registry', () => {
        it('listens to everything the StyleSheet reads, without the theme with CSS variables', () => {
            const services = createServices({ CSSVars: true })
            const stylesheet = (t: typeof theme, rt: UnistylesMiniRuntime) => ({
                box: { color: t.colors.primary, width: rt.screen.width },
            })

            services.shadowRegistry.addStyles([createStyle(stylesheet, 'box')])

            expect(services.viewDependencies()).toEqual([[UnistyleDependency.Dimensions]])
        })

        it("recomputes the StyleSheet for what a dynamic function reads, so it doesn't read a stale mini runtime", () => {
            const services = createServices()
            let fontScale = 1

            services.runtime.getMiniRuntime = () => ({ fontScale, insets: {} })

            const stylesheet = (_: typeof theme, rt: UnistylesMiniRuntime) => ({
                text: (size: number) => ({ fontSize: size * rt.fontScale }),
            })

            const { parsedStyles } = services.shadowRegistry.addStyles([createStyle(stylesheet, 'text', [10])])

            expect(parsedStyles.fontSize).toBe(10)
            expect(services.stylesheetDependencies().at(-1)).toContain(UnistyleDependency.FontScale)
            expect(services.viewDependencies()).toEqual([
                sorted(UnistyleDependency.Theme, UnistyleDependency.FontScale),
            ])

            fontScale = 2
            services.emit(UnistyleDependency.FontScale)

            expect(services.registry.applyStyles).toHaveBeenLastCalledWith(
                expect.any(String),
                expect.objectContaining({ fontSize: 20 }),
            )
        })

        it("doesn't listen to what dynamic functions of other views read", () => {
            const services = createServices()
            let ime = 0

            services.runtime.getMiniRuntime = () => ({ insets: { top: 0, bottom: 0, left: 0, right: 0, ime } })

            const stylesheet = (_: typeof theme, rt: UnistylesMiniRuntime) => ({
                box: { flex: 1 },
                keyboard: () => ({ paddingBottom: rt.insets.ime }),
            })

            services.shadowRegistry.addStyles([createStyle(stylesheet, 'keyboard')])
            services.shadowRegistry.addStyles([createStyle(stylesheet, 'box')])

            // the StyleSheet recomputes for the keyboard, only the view that calls it listens
            expect(services.stylesheetDependencies().at(-1)).toContain(UnistyleDependency.Ime)
            expect(services.viewDependencies()).toEqual([
                sorted(UnistyleDependency.Theme, UnistyleDependency.Ime),
                [UnistyleDependency.Theme],
            ])

            services.registry.applyStyles.mockClear()
            ime = 300
            services.emit(UnistyleDependency.Ime)

            expect(services.registry.applyStyles).toHaveBeenCalledTimes(1)
            expect(services.registry.applyStyles).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({ paddingBottom: 300 }),
            )
        })

        it('records what a getter reads, only for the views of its style', () => {
            const services = createServices()
            let width = 300

            services.runtime.getMiniRuntime = () => ({ screen: { width, height: 800 }, insets: {} })

            const stylesheet = (_: typeof theme, rt: UnistylesMiniRuntime) => ({
                box: {
                    get width() {
                        return rt.screen.width
                    },
                },
                other: { flex: 1 },
            })

            services.shadowRegistry.addStyles([createStyle(stylesheet, 'box')])
            services.shadowRegistry.addStyles([createStyle(stylesheet, 'other')])

            expect(services.viewDependencies()).toEqual([
                sorted(UnistyleDependency.Theme, UnistyleDependency.Dimensions),
                [UnistyleDependency.Theme],
            ])

            services.registry.applyStyles.mockClear()
            width = 600
            services.emit(UnistyleDependency.Dimensions)

            expect(services.registry.applyStyles).toHaveBeenCalledTimes(1)
            expect(services.registry.applyStyles).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({ width: 600 }),
            )
        })

        it('listens to what the StyleSheet reads when it reruns for another view', () => {
            const services = createServices()
            let compact = false

            services.runtime.getMiniRuntime = () => ({ insets: { top: 20, bottom: 0, left: 0, right: 0, ime: 0 } })

            const stylesheet = (_: typeof theme, rt: UnistylesMiniRuntime) => ({
                box: { paddingTop: compact ? rt.insets.top : 0 },
                keyboard: () => ({ paddingBottom: rt.insets.ime }),
            })

            services.shadowRegistry.addStyles([createStyle(stylesheet, 'keyboard')])
            services.shadowRegistry.addStyles([createStyle(stylesheet, 'box')])

            // only the keyboard view listens to the keyboard, it reruns the StyleSheet, which now reads the insets
            compact = true
            services.emit(UnistyleDependency.Ime)

            expect(services.viewDependencies()).toContainEqual(
                sorted(UnistyleDependency.Theme, UnistyleDependency.Insets),
            )

            services.registry.applyStyles.mockClear()
            services.emit(UnistyleDependency.Insets)

            expect(services.registry.applyStyles).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({ paddingTop: 20 }),
            )
        })

        it("doesn't apply styles that didn't change", () => {
            const services = createServices()
            let width = 300

            services.runtime.getMiniRuntime = () => ({ screen: { width, height: 800 }, insets: {} })

            // only `wide` changes with the screen, `narrow` depends on it as part of the same StyleSheet
            const stylesheet = (_: typeof theme, rt: UnistylesMiniRuntime) => ({
                wide: { flexDirection: rt.screen.width > 500 ? 'row' : 'column' },
                narrow: { flex: 1 },
            })

            services.shadowRegistry.addStyles([createStyle(stylesheet, 'narrow')])
            services.registry.applyStyles.mockClear()

            width = 600
            services.emit(UnistyleDependency.Dimensions)

            expect(services.registry.applyStyles).not.toHaveBeenCalled()

            services.shadowRegistry.addStyles([createStyle(stylesheet, 'wide')])
            services.registry.applyStyles.mockClear()

            width = 300
            services.emit(UnistyleDependency.Dimensions)

            expect(services.registry.applyStyles).toHaveBeenCalledTimes(1)
            expect(services.registry.applyStyles).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({ flexDirection: 'column' }),
            )
        })
    })
})
