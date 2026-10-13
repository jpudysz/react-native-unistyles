describe('ScopedThemeContext', () => {
    afterEach(() => {
        jest.dontMock('react')
    })

    it('does not throw on import when React has no createContext (React Server Components)', () => {
        jest.isolateModules(() => {
            jest.doMock('react', () => ({}))

            const { ScopedThemeContext } = require('../components/ScopedThemeContext')

            expect(ScopedThemeContext).toBeNull()
        })
    })

    it('is a React context everywhere else', () => {
        jest.isolateModules(() => {
            const { ScopedThemeContext } = require('../components/ScopedThemeContext')

            expect(ScopedThemeContext).toHaveProperty('Provider')
        })
    })
})
