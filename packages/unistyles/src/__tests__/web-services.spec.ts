const createBrowserGlobals = () => {
    const rootElement = {
        classList: {
            add: jest.fn(),
            remove: jest.fn(),
        },
    }
    const styleElement = {
        compareDocumentPosition: jest.fn(() => 4),
        id: '',
        innerText: '',
        nextSibling: null,
        setAttribute: jest.fn(),
    }
    const anchorElement = {
        compareDocumentPosition: jest.fn(() => 4),
        id: '',
        innerText: '',
        nextSibling: null,
        setAttribute: jest.fn(),
    }
    const head = {
        appendChild: jest.fn(),
        insertBefore: jest.fn(),
        querySelectorAll: jest.fn(() => [] as Array<object>),
    }
    const createElement = jest.fn().mockReturnValueOnce(styleElement).mockReturnValue(anchorElement)
    const getElementById = jest.fn((id: string) => {
        if (id === styleElement.id) {
            return styleElement
        }

        if (id === anchorElement.id) {
            return anchorElement
        }

        return null
    })

    Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: {
            addEventListener: jest.fn(),
            devicePixelRatio: 1,
            innerHeight: 768,
            innerWidth: 1024,
            matchMedia: jest.fn(() => ({
                addEventListener: jest.fn(),
                matches: false,
            })),
        },
    })
    Object.defineProperty(globalThis, 'document', {
        configurable: true,
        value: {
            createElement,
            documentElement: rootElement,
            getElementById,
            head,
            querySelector: jest.fn(() => rootElement),
        },
    })
    Object.defineProperty(globalThis, 'Node', {
        configurable: true,
        value: {
            DOCUMENT_POSITION_FOLLOWING: 4,
        },
    })

    return { anchorElement, head, styleElement }
}

describe('web services', () => {
    const originalWindow = globalThis.window
    const originalDocument = globalThis.document
    const originalNode = globalThis.Node
    let browserGlobals: ReturnType<typeof createBrowserGlobals>

    beforeEach(() => {
        jest.resetModules()
        browserGlobals = createBrowserGlobals()
        Reflect.deleteProperty(globalThis, '__unistyles__')
    })

    afterEach(() => {
        Object.defineProperty(globalThis, 'window', {
            configurable: true,
            value: originalWindow,
        })
        Object.defineProperty(globalThis, 'document', {
            configurable: true,
            value: originalDocument,
        })
        Object.defineProperty(globalThis, 'Node', {
            configurable: true,
            value: originalNode,
        })
        Reflect.deleteProperty(globalThis, '__unistyles__')
    })

    it('reuses one browser runtime across separately evaluated module graphs', () => {
        let firstServices: typeof import('../web/services').services | undefined
        let secondServices: typeof import('../web/services').services | undefined

        jest.isolateModules(() => {
            firstServices = require('../web/services').services
        })
        jest.isolateModules(() => {
            secondServices = require('../web/services').services
        })

        expect(firstServices).toBeDefined()
        expect(secondServices).toBe(firstServices)
    })

    it('keeps dependency-updated browser rules at normal class specificity', () => {
        let services: typeof import('../web/services').services | undefined

        jest.isolateModules(() => {
            services = require('../web/services').services
        })

        services?.registry.css.set({
            className: 'unistyles_browser',
            propertyKey: 'color',
            value: 'tomato',
        })
        services?.registry.css.recreate()

        expect(browserGlobals.styleElement.innerText).toBe('.unistyles_browser{color:tomato;}')

        services?.registry.applyStyles('unistyles_browser', { color: 'royalblue' })

        expect(browserGlobals.styleElement.innerText).toBe('.unistyles_browser{color:royalblue;}')
    })

    it('keeps a precedence anchor and the runtime stylesheet after late RSC resources', () => {
        let services: typeof import('../web/services').services | undefined
        const resourceElement = {
            nextSibling: null,
        }

        jest.isolateModules(() => {
            services = require('../web/services').services
        })

        browserGlobals.head.insertBefore.mockClear()
        browserGlobals.head.querySelectorAll.mockReturnValue([browserGlobals.anchorElement, resourceElement])
        browserGlobals.anchorElement.compareDocumentPosition.mockReturnValue(0)
        services?.registry.css.set({
            className: 'unistyles_ordered',
            propertyKey: 'color',
            value: 'royalblue',
        })
        services?.registry.css.recreate()

        expect(browserGlobals.head.insertBefore).toHaveBeenCalledWith(browserGlobals.anchorElement, null)
        expect(browserGlobals.head.insertBefore).toHaveBeenCalledWith(browserGlobals.styleElement, null)
    })

    it('keeps child styles when a callback ref reconnects before deferred cleanup', async () => {
        let services: typeof import('../web/services').services | undefined

        jest.isolateModules(() => {
            services = require('../web/services').services
        })

        const values = { color: 'tomato' }
        const { hash } = services!.registry.add(values, true)
        const firstRef = {} as HTMLElement
        const nextRef = {} as HTMLElement

        services!.registry.connect(firstRef, hash)
        const removal = services!.registry.remove(firstRef, hash)
        services!.registry.connect(nextRef, hash)

        await expect(removal).resolves.toBe(false)
        expect(services!.registry.add(values, true)).toEqual({ existingHash: true, hash })
        expect(services!.registry.css.getStyles()).toContain(`.${hash}{color:tomato;}`)
    })
})
