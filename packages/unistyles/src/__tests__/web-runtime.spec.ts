import { Orientation } from '../specs/types'
import { UnistylesRuntime } from '../web/runtime'

jest.mock('../web/services', () => ({}))

const mockBrowser = ({
    screenOrientation,
    viewportPortrait,
}: {
    screenOrientation?: string
    viewportPortrait: boolean
}) => {
    Object.assign(globalThis, {
        window: {
            matchMedia: (query: string) => ({
                matches: query === '(orientation: portrait)' ? viewportPortrait : false,
            }),
        },
        document: {
            querySelector: () => null,
        },
        screen: {
            orientation: screenOrientation ? { type: screenOrientation } : undefined,
        },
    })
}

describe('UnistylesRuntime web orientation', () => {
    afterEach(() => {
        // @ts-expect-error cleanup of browser globals
        delete globalThis.window
        // @ts-expect-error cleanup of browser globals
        delete globalThis.document
        // @ts-expect-error cleanup of browser globals
        delete globalThis.screen
    })

    it('reads orientation from the Screen Orientation API', () => {
        mockBrowser({ screenOrientation: 'landscape-primary', viewportPortrait: true })

        const runtime = new UnistylesRuntime({} as never)

        expect(runtime.orientation).toBe(Orientation.Landscape)
    })

    it('falls back to the viewport when the Screen Orientation API is missing', () => {
        mockBrowser({ viewportPortrait: false })

        const runtime = new UnistylesRuntime({} as never)

        expect(runtime.orientation).toBe(Orientation.Landscape)
        expect(runtime.isLandscape).toBe(true)

        mockBrowser({ viewportPortrait: true })

        expect(runtime.orientation).toBe(Orientation.Portrait)
        expect(runtime.isPortrait).toBe(true)
    })
})
