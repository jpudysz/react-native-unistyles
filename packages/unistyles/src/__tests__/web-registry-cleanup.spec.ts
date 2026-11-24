import * as unistyles from '../web/services'

type DOM = { window: Window & typeof globalThis }

// The React Native preset can't run in the jsdom environment, so the tests bring their own document
const { JSDOM } = jest.requireActual('jsdom') as { JSDOM: new () => DOM }

const registry = unistyles.services.registry

// An element styled by its class and connected the way a Unistyles component's ref connects it
const connectedElement = (hash: string) => {
    const element = document.createElement('div')

    element.className = hash
    registry.connect(element, hash)

    return element
}

beforeEach(() => {
    globalThis.document = new JSDOM().window.document
})

afterAll(() => {
    // @ts-expect-error the node environment has no document
    delete globalThis.document
})

describe('web registry cleanup', () => {
    it('drops the rule of a style no element uses anymore', async () => {
        const { hash } = registry.add({ marginBottom: 17 })
        const element = connectedElement(hash)

        document.body.appendChild(element)
        element.remove()

        await expect(registry.remove(element, hash)).resolves.toBe(true)
        expect(registry.css.getStyles()).not.toContain(`.${hash}{`)
    })

    it('keeps the rule while an element outside the document still uses the style', async () => {
        const { hash } = registry.add({ marginBottom: 19 })
        const replaced = connectedElement(hash)

        document.body.appendChild(replaced)

        // One commit replaces the element: the old one leaves the document, and the new one connects
        // inside a portal container that is attached to the document only later
        replaced.remove()
        const removal = registry.remove(replaced, hash)
        connectedElement(hash)

        await expect(removal).resolves.toBe(false)
        expect(registry.css.getStyles()).toContain(`.${hash}{margin-bottom:19px;}`)
        expect(registry.add({ marginBottom: 19 }).existingHash).toBe(true)
    })
})
