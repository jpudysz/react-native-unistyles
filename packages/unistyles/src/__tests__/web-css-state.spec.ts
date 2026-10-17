import { CSSState } from '../web/css/state'

// the services module builds a registry (and a CSSState) at import time
jest.mock('../web/services', () => ({ services: {} }))

const flushMicrotasks = () => new Promise<void>((resolve) => queueMicrotask(resolve))

const createStyleTag = () => {
    const writes = Array<string>()
    const styleTag = {
        id: 'unistyles-web',
        set innerText(value: string) {
            writes.push(value)
        },
    }

    return { styleTag, writes }
}

describe('CSSState style tag writes', () => {
    const originalWindow = (globalThis as any).window
    const originalDocument = (globalThis as any).document

    afterEach(() => {
        ;(globalThis as any).window = originalWindow
        ;(globalThis as any).document = originalDocument
    })

    const createState = () => {
        const { styleTag, writes } = createStyleTag()

        ;(globalThis as any).window = {}
        ;(globalThis as any).document = {
            getElementById: (id: string) => (id === 'unistyles-web' ? styleTag : null),
        }

        return { state: new CSSState({} as never), writes }
    }

    it('coalesces recreate calls in one tick into a single write of the final stylesheet', async () => {
        const { state, writes } = createState()

        state.set({ className: 'a', propertyKey: 'color', value: 'red' })
        state.recreate()
        state.set({ className: 'b', propertyKey: 'marginTop', value: '4px' })
        state.recreate()
        state.recreate()

        expect(writes).toEqual([])

        await flushMicrotasks()

        expect(writes).toEqual(['.a{color:red;}.b{margin-top:4px;}'])
        expect(writes[0]).toBe(state.getStyles())
    })

    it('writes again for changes made after a flush', async () => {
        const { state, writes } = createState()

        state.set({ className: 'a', propertyKey: 'color', value: 'red' })
        state.recreate()
        await flushMicrotasks()

        state.remove('a')
        await flushMicrotasks()

        expect(writes).toEqual(['.a{color:red;}', ''])
    })
})
