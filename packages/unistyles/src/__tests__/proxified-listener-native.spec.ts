import { UnistyleDependency } from '../specs/NativePlatform/NativePlatform.nitro'

const mockChangeListeners: Array<(changedDependencies: Array<UnistyleDependency>) => void> = []

jest.mock('../specs', () => ({
    UnistyleDependency: jest.requireActual('../specs/NativePlatform/NativePlatform.nitro').UnistyleDependency,
    StyleSheet: {
        addChangeListener: (onChange: (changedDependencies: Array<UnistyleDependency>) => void) => {
            mockChangeListeners.push(onChange)

            return () => {}
        },
    },
}))

const { listener } =
    require('../core/useProxifiedUnistyles/listener.native.ts') as typeof import('../core/useProxifiedUnistyles/listener.native')

describe('useProxifiedUnistyles native listener', () => {
    const listen = (dependencies: Array<UnistyleDependency>) => {
        const updateTheme = jest.fn()
        const updateRuntime = jest.fn()

        listener({ dependencies, updateTheme, updateRuntime })

        return { updateTheme, updateRuntime, emit: mockChangeListeners.at(-1)! }
    }

    it('reports a theme change on its own as theme only', () => {
        const { updateTheme, updateRuntime, emit } = listen([UnistyleDependency.Theme, UnistyleDependency.ThemeName])

        emit([UnistyleDependency.Theme, UnistyleDependency.ThemeName])

        expect(updateTheme).toHaveBeenCalledTimes(1)
        expect(updateRuntime).toHaveBeenCalledWith(true)
    })

    // Enabling adaptive themes switches the theme in the same batch, scoped components must still see it
    it('does not report a batch with other listened changes next to the theme as theme only', () => {
        const { updateRuntime, emit } = listen([UnistyleDependency.AdaptiveThemes, UnistyleDependency.ThemeName])

        emit([UnistyleDependency.AdaptiveThemes, UnistyleDependency.Theme, UnistyleDependency.ThemeName])

        expect(updateRuntime).toHaveBeenCalledWith(false)
    })

    it('ignores changes the component does not listen to when deciding', () => {
        const { updateRuntime, emit } = listen([UnistyleDependency.ThemeName])

        emit([UnistyleDependency.AdaptiveThemes, UnistyleDependency.Theme, UnistyleDependency.ThemeName])

        expect(updateRuntime).toHaveBeenCalledWith(true)
    })

    it('does not update for changes it does not listen to', () => {
        const { updateTheme, updateRuntime, emit } = listen([UnistyleDependency.AdaptiveThemes])

        emit([UnistyleDependency.Insets])

        expect(updateTheme).not.toHaveBeenCalled()
        expect(updateRuntime).not.toHaveBeenCalled()
    })
})
