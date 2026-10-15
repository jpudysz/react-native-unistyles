import { CSSState } from '../web/css/state'

jest.mock('../web/services', () => ({}))

describe('Server rendered page in the browser', () => {
    afterEach(() => {
        // @ts-expect-error cleanup of browser globals
        delete globalThis.window
        // @ts-expect-error cleanup of browser globals
        delete globalThis.document
    })

    it('takes over the styles rendered by the server, without hydrateServerUnistyles', () => {
        const styleTag = { innerText: '' }
        const script = { remove: jest.fn() }

        Object.assign(globalThis, {
            window: {
                __UNISTYLES_STATE__: {
                    mainState: [['', [['unistyles_abc', [['color', 'red']]]]]],
                    mqState: [],
                },
            },
            document: {
                getElementById: (id: string) => (id === 'unistyles-web' ? styleTag : null),
                querySelector: (selector: string) => (selector === '#unistyles-script' ? script : null),
            },
        })

        const css = new CSSState({} as never)

        expect(css.getStyles()).toBe('.unistyles_abc{color:red;}')
        expect(script.remove).toHaveBeenCalled()
    })
})
