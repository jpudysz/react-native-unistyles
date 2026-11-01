// useAnimatedVariantColor rendered during SSR, eg. by Expo Router server output
const mockParsedStyles: Record<string, unknown> = {}

// the hook is called as a plain function, outside of React
jest.mock('react', () => {
    const actual = jest.requireActual('react')

    return {
        ...actual,
        useState: (initial: unknown) => [typeof initial === 'function' ? initial() : initial, () => {}],
        useMemo: (factory: () => unknown) => factory(),
        useCallback: (callback: unknown) => callback,
        useEffect: () => {},
        useLayoutEffect: () => {},
    }
})
jest.mock('react-native-reanimated', () => ({
    runOnUI: (fn: () => void) => fn,
    useSharedValue: (value: unknown) => ({ get: () => value }),
}))
jest.mock('../specs', () => ({ UnistyleDependency: { Theme: 0, Breakpoints: 1 } }))
jest.mock('../web/services', () => ({
    services: {
        shadowRegistry: { addStyles: () => ({ parsedStyles: mockParsedStyles }) },
        listener: { addListeners: () => () => {} },
        runtime: {},
    },
}))

// Jest resolves the .native files by default
const { useUpdateVariantColor } =
    require('../reanimated/variant/useUpdateVariantColor.ts') as typeof import('../reanimated/variant/useUpdateVariantColor')

const render = () =>
    useUpdateVariantColor({
        colorKey: 'backgroundColor',
        style: {},
        secretKey: undefined,
        animateCallback: () => {},
    } as never)

describe('useUpdateVariantColor', () => {
    const globals = globalThis as Record<string, unknown>
    const originalWindow = globals.window
    const originalDocument = globals.document
    const originalGetComputedStyle = globals.getComputedStyle

    beforeEach(() => {
        mockParsedStyles.backgroundColor = 'var(--colors-primary)'
    })

    afterEach(() => {
        globals.window = originalWindow
        globals.document = originalDocument
        globals.getComputedStyle = originalGetComputedStyle
    })

    it('renders on the server without touching document', () => {
        delete globals.window
        delete globals.document

        expect(render().toValue.get()).toBe('rgb(0, 0, 0)')
    })

    it('keeps plain colors on the server', () => {
        mockParsedStyles.backgroundColor = 'rgb(255, 0, 0)'
        delete globals.document

        expect(render().toValue.get()).toBe('rgb(255, 0, 0)')
    })

    it('resolves CSS variables with a hidden element in the browser', () => {
        const div = { style: {} as Record<string, string> }
        const appendChild = jest.fn()

        globals.window = {}
        globals.document = { createElement: jest.fn(() => div), body: { appendChild } }
        globals.getComputedStyle = jest.fn(() => ({ color: 'rgb(1, 2, 3)' }))

        const { fromValue, toValue } = render()

        expect(appendChild).toHaveBeenCalledWith(div)
        expect(div.style).toEqual({ display: 'none', color: 'var(--colors-primary)' })
        expect(fromValue.get()).toBe('rgb(1, 2, 3)')
        expect(toValue.get()).toBe('rgb(1, 2, 3)')
    })
})
