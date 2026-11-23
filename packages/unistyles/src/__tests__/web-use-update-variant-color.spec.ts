// useAnimatedVariantColor rendered during SSR, eg. by Expo Router server output
const mockParsedStyles: Record<string, unknown> = {}
// layout effects run in the browser only
let mockRunLayoutEffects = false

// the hook is called as a plain function, outside of React
jest.mock('react', () => {
    const actual = jest.requireActual('react')

    return {
        ...actual,
        useState: (initial: unknown) => [typeof initial === 'function' ? initial() : initial, () => {}],
        useMemo: (factory: () => unknown) => factory(),
        useCallback: (callback: unknown) => callback,
        useEffect: () => {},
        useLayoutEffect: (effect: () => void) => mockRunLayoutEffects && effect(),
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

const render = () => {
    const animateCallback = jest.fn()
    const { fromValue, toValue } = useUpdateVariantColor({
        colorKey: 'backgroundColor',
        style: {},
        secretKey: undefined,
        animateCallback,
    } as never)

    return { animateCallback, fromValue: fromValue.get(), toValue: toValue.get() }
}

describe('useUpdateVariantColor', () => {
    const globals = globalThis as Record<string, unknown>
    const originalWindow = globals.window
    const originalDocument = globals.document
    const originalGetComputedStyle = globals.getComputedStyle

    const mockBrowser = () => {
        const div = { style: {} as Record<string, string> }
        const appendChild = jest.fn()

        mockRunLayoutEffects = true
        globals.window = {}
        globals.document = { createElement: jest.fn(() => div), body: { appendChild } }
        globals.getComputedStyle = jest.fn(() => ({ color: 'rgb(1, 2, 3)' }))

        return { div, appendChild }
    }

    beforeEach(() => {
        mockParsedStyles.backgroundColor = 'var(--colors-primary)'
    })

    afterEach(() => {
        mockRunLayoutEffects = false
        globals.window = originalWindow
        globals.document = originalDocument
        globals.getComputedStyle = originalGetComputedStyle
    })

    it('renders on the server without touching document', () => {
        delete globals.window
        delete globals.document

        expect(render()).toMatchObject({ fromValue: 'rgb(0, 0, 0)', toValue: 'rgb(0, 0, 0)' })
    })

    // hydration keeps the server's inline style, Reanimated only writes a value that changed
    it('starts from the server color in the browser and sets the resolved CSS variable before paint', () => {
        const { div, appendChild } = mockBrowser()
        const { animateCallback, fromValue, toValue } = render()

        expect(fromValue).toBe('rgb(0, 0, 0)')
        expect(toValue).toBe('rgb(0, 0, 0)')
        expect(appendChild).toHaveBeenCalledWith(div)
        expect(div.style).toEqual({ display: 'none', color: 'var(--colors-primary)' })
        expect(animateCallback).toHaveBeenCalledWith('rgb(0, 0, 0)', 'rgb(1, 2, 3)')
    })

    it('sets plain colors before paint in the browser', () => {
        mockParsedStyles.backgroundColor = 'rgb(255, 0, 0)'
        mockBrowser()

        expect(render().animateCallback).toHaveBeenCalledWith('rgb(0, 0, 0)', 'rgb(255, 0, 0)')
    })
})
