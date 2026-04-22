/**
 * @jest-environment jsdom
 */
import type { UnistylesServices } from '../web/types'

// Stub the services singleton and CSSState to avoid the circular-import chain
// (registry -> utils/unistyle -> services -> registry) that runs at module load.
jest.mock('../web/services', () => ({ services: {} }))
jest.mock('../web/css', () => ({
    CSSState: class {
        remove = jest.fn()
        reset = jest.fn()
    },
}))

// eslint-disable-next-line import/first
import { UnistylesRegistry } from '../web/registry'

const createRegistry = () => {
    const registry = new UnistylesRegistry({} as UnistylesServices)
    const cssRemoveSpy = registry.css.remove as jest.Mock

    return { registry, cssRemoveSpy }
}

describe('UnistylesRegistry counter', () => {
    afterEach(() => {
        document.body.innerHTML = ''
    })

    it('cleans up the CSS rule only after every connect has a matching remove', async () => {
        const { registry, cssRemoveSpy } = createRegistry()
        const a = document.createElement('div')
        const b = document.createElement('div')

        registry.connect(a, 'hash-1')
        registry.connect(b, 'hash-1')

        await registry.remove(a, 'hash-1')

        expect(cssRemoveSpy).not.toHaveBeenCalled()

        await registry.remove(b, 'hash-1')

        expect(cssRemoveSpy).toHaveBeenCalledTimes(1)
        expect(cssRemoveSpy).toHaveBeenCalledWith('hash-1')
    })

    it('keeps the CSS rule alive when a new connect races the cleanup microtask', async () => {
        const { registry, cssRemoveSpy } = createRegistry()
        const a = document.createElement('div')
        const b = document.createElement('div')

        registry.connect(a, 'hash-2')
        const pending = registry.remove(a, 'hash-2')

        registry.connect(b, 'hash-2')

        const removed = await pending

        expect(removed).toBe(false)
        expect(cssRemoveSpy).not.toHaveBeenCalled()
    })

    it('keeps the CSS rule alive when another element still carries the class', async () => {
        const { registry, cssRemoveSpy } = createRegistry()
        const tracked = document.createElement('div')
        const untracked = document.createElement('div')

        untracked.classList.add('hash-3')
        document.body.appendChild(untracked)

        registry.connect(tracked, 'hash-3')

        const removed = await registry.remove(tracked, 'hash-3')

        expect(removed).toBe(false)
        expect(cssRemoveSpy).not.toHaveBeenCalled()
    })
})
