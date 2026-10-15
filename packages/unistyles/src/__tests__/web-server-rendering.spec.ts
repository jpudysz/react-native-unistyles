const themes = {
    light: { colors: { text: '#000000' } },
    dark: { colors: { text: '#ffffff' } },
}

// A fresh server: Unistyles keeps its services on `globalThis` there
const loadServer = () => {
    // @ts-expect-error reset of the server's services
    delete globalThis.__unistyles__

    let modules = {} as {
        create: typeof import('../web/create').create
        services: typeof import('../web/services').services
    }

    jest.isolateModules(() => {
        // `services` first, as the app's entry would load it
        const { services } = require('../web/services')

        modules = { create: require('../web/create').create, services }
    })

    return modules
}

describe('Server rendering', () => {
    it('creates a StyleSheet created before StyleSheet.configure once used, configured', () => {
        const { create, services } = loadServer()

        // e.g. a route module that Expo Router loads before the document importing the configuration
        const styles = create((theme: any) => ({ text: { color: theme.colors.text } }))

        services.state.init({ themes, settings: { adaptiveThemes: true } } as never)

        expect(styles.text).toBeDefined()
        expect(Object.keys(styles)).toEqual(['text', 'useVariants'])
        expect('useVariants' in styles).toBe(true)
    })

    it('still tells that StyleSheet.configure is missing when such a StyleSheet is used before it', () => {
        const { create } = loadServer()

        const styles = create((theme: any) => ({ text: { color: theme.colors.text } }))

        expect(() => styles.text).toThrow('StyleSheet.configure')
    })

    it('creates a StyleSheet right away once configured', () => {
        const { create, services } = loadServer()

        services.state.init({ themes, settings: { adaptiveThemes: true } } as never)

        const styles = create((theme: any) => ({ text: { color: theme.colors.text } }))

        expect(styles.text).toBeDefined()
    })
})
