import { getScopedThemeName, withScopedTheme } from '../components/ScopedThemeContext'
import { UnistylesShadowRegistry } from '../specs'

jest.mock('../specs', () => {
    let scopedTheme: string | undefined

    return {
        UnistylesShadowRegistry: {
            getScopedTheme: () => scopedTheme,
            setScopedTheme: (themeName?: string) => {
                scopedTheme = themeName
            },
        },
    }
})

describe('ScopedThemeContext', () => {
    beforeEach(() => {
        UnistylesShadowRegistry.setScopedTheme(undefined)
    })

    describe('withScopedTheme', () => {
        it('runs the callback with the registry untouched outside every ScopedTheme', () => {
            UnistylesShadowRegistry.setScopedTheme('light')

            expect(withScopedTheme(null, () => UnistylesShadowRegistry.getScopedTheme())).toBe('light')
            expect(UnistylesShadowRegistry.getScopedTheme()).toBe('light')
        })

        it('runs the callback in the scoped theme and restores the previous one', () => {
            UnistylesShadowRegistry.setScopedTheme('light')

            expect(withScopedTheme({ name: 'dark' as never }, () => UnistylesShadowRegistry.getScopedTheme())).toBe(
                'dark',
            )
            expect(UnistylesShadowRegistry.getScopedTheme()).toBe('light')
        })

        it('runs the callback without a scoped theme inside a reset ScopedTheme', () => {
            UnistylesShadowRegistry.setScopedTheme('dark')

            expect(withScopedTheme({ name: undefined }, () => UnistylesShadowRegistry.getScopedTheme())).toBeUndefined()
            expect(UnistylesShadowRegistry.getScopedTheme()).toBe('dark')
        })

        it('restores the previous scoped theme when the callback throws', () => {
            expect(() =>
                withScopedTheme({ name: 'dark' as never }, () => {
                    throw new Error('style error')
                }),
            ).toThrow('style error')
            expect(UnistylesShadowRegistry.getScopedTheme()).toBeUndefined()
        })
    })

    describe('getScopedThemeName', () => {
        it('prefers the context over the registry', () => {
            UnistylesShadowRegistry.setScopedTheme('light')

            expect(getScopedThemeName({ name: 'dark' as never })).toBe('dark')
            expect(getScopedThemeName({ name: undefined })).toBeUndefined()
        })

        it('falls back to the registry outside every ScopedTheme', () => {
            UnistylesShadowRegistry.setScopedTheme('light')

            expect(getScopedThemeName(null)).toBe('light')
        })
    })
})
