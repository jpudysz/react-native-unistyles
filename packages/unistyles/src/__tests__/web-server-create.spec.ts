const themes = {
    light: { colors: { text: '#000000' } },
    dark: { colors: { text: '#ffffff' } },
}

// A fresh server: Unistyles keeps its services on globalThis there
const loadServer = () => {
    // @ts-expect-error reset of the server services
    delete globalThis.__unistyles__

    let modules = {} as {
        create: typeof import('../web/create').create
        services: typeof import('../web/services').services
    }

    jest.isolateModules(() => {
        modules = {
            services: require('../web/services').services,
            create: require('../web/create').create,
        }
    })

    return modules
}

describe('StyleSheet.create on the server', () => {
    it('creates a StyleSheet created before StyleSheet.configure on first use', () => {
        const { create, services } = loadServer()
        // e.g. a route that Expo Router loads to read its metadata, before the document importing the config
        const stylesheet = jest.fn((theme: any) => ({ text: { color: theme.colors.text } }))
        const styles = create(stylesheet)

        expect(stylesheet).not.toHaveBeenCalled()

        services.state.init({ themes, settings: { initialTheme: 'dark' } } as never)

        expect(styles.text).toBeDefined()
        expect(stylesheet).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ themeName: 'dark' }))
        expect(Object.keys(styles)).toEqual(['text', 'useVariants'])
        expect({ ...styles }.text).toBe(styles.text)
    })

    it('behaves like the StyleSheet create returns once configured', () => {
        const { create, services } = loadServer()
        const box = jest.fn((size: number) => ({ width: size }))
        const styles = create((theme: any) => ({
            text: { color: theme.colors.text },
            box,
        })) as any

        services.state.init({ themes, settings: { initialTheme: 'light' } } as never)

        expect('text' in styles).toBe(true)
        expect(styles.text).toBe(styles.text)
        expect(styles.box(10)).toBeDefined()
        expect(box).toHaveBeenCalledWith(10)
        expect(Object.keys(styles.useVariants({}))).toEqual(['text', 'box', 'useVariants'])

        styles.extra = 1

        expect(styles.extra).toBe(1)
        expect(() => Object.freeze(styles)).not.toThrow()
        expect(Object.isFrozen(styles)).toBe(true)
    })

    it('still tells that StyleSheet.configure is missing when such a StyleSheet is used before it', () => {
        const { create } = loadServer()
        const styles = create((theme: any) => ({ text: { color: theme.colors.text } }))

        expect(() => styles.text).toThrow('StyleSheet.configure')
    })

    it('creates an object StyleSheet right away before StyleSheet.configure', () => {
        const { create } = loadServer()
        // A server has no window, the React Native preset adds one
        const browserWindow = globalThis.window

        // @ts-expect-error the server has no window
        delete globalThis.window

        try {
            const styles = create({ text: { color: 'red' } })

            expect(require('util').types.isProxy(styles)).toBe(false)
            expect(styles.text).toBeDefined()
        } finally {
            globalThis.window = browserWindow
        }
    })

    it('creates a StyleSheet right away once configured', () => {
        const { create, services } = loadServer()

        services.state.init({ themes, settings: { initialTheme: 'light' } } as never)

        const stylesheet = jest.fn((theme: any) => ({ text: { color: theme.colors.text } }))

        const styles = create(stylesheet)

        expect(stylesheet).toHaveBeenCalled()
        expect(require('util').types.isProxy(styles)).toBe(false)
    })
})
