// useMedia (<Display>/<Hide>) rendered during SSR, eg. by Expo Router server output
// the hook is called as a plain function, outside of React
jest.mock('react', () => {
    const actual = jest.requireActual('react')

    return {
        ...actual,
        useRef: (value: unknown) => ({ current: value }),
        useState: (initial: unknown) => [typeof initial === 'function' ? initial() : initial, () => {}],
        useEffect: () => {},
    }
})

// Jest resolves the .native files by default
const { useMedia } = require('../hooks/useMedia.ts') as typeof import('../hooks/useMedia')

// mq.only.width(100, 500)
const MQ = ':w[100, 500]' as unknown as symbol

describe('useMedia', () => {
    const globals = globalThis as Record<string, unknown>
    const originalWindow = globals.window
    const originalDocument = globals.document

    afterEach(() => {
        globals.window = originalWindow
        globals.document = originalDocument
    })

    it('hides the content on the server without touching window', () => {
        delete globals.window
        delete globals.document

        expect(useMedia({ mq: MQ })).toEqual({ isVisible: false })
    })

    it('does not read the media query on the server', () => {
        const matchMedia = jest.fn()

        globals.window = { matchMedia }
        delete globals.document

        expect(useMedia({ mq: MQ })).toEqual({ isVisible: false })
        expect(matchMedia).not.toHaveBeenCalled()
    })

    it('reads and listens to the media query in the browser', () => {
        const addEventListener = jest.fn()
        const matchMedia = jest.fn(() => ({ matches: true, addEventListener, removeEventListener: jest.fn() }))

        globals.window = { matchMedia }
        globals.document = {}

        expect(useMedia({ mq: MQ })).toEqual({ isVisible: true })
        expect(matchMedia).toHaveBeenCalledWith('(min-width: 100px) and (max-width: 500px)')
        expect(addEventListener).toHaveBeenCalledWith('change', expect.any(Function))
    })
})
