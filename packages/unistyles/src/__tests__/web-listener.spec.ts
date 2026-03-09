import { UnistyleDependency } from '../specs/NativePlatform'
import { UnistylesListener } from '../web/listener'

describe('UnistylesListener public change listeners', () => {
    it('emits dependency arrays and unsubscribes listeners', () => {
        const listener = new UnistylesListener({} as never)
        const onChange = jest.fn()
        const dispose = listener.addChangeListener(onChange)

        listener.emitChanges([UnistyleDependency.Theme, UnistyleDependency.ThemeName])

        expect(onChange).toHaveBeenCalledTimes(1)
        expect(onChange).toHaveBeenCalledWith([UnistyleDependency.Theme, UnistyleDependency.ThemeName])

        dispose()
        listener.emitChanges([UnistyleDependency.Theme])

        expect(onChange).toHaveBeenCalledTimes(1)
    })

    it('passes a fresh dependency array to each public listener', () => {
        const listener = new UnistylesListener({} as never)
        const firstListenerCalls = Array<Array<UnistyleDependency>>()
        const firstListener = jest.fn((dependencies: Array<UnistyleDependency>) => {
            firstListenerCalls.push([...dependencies])
            dependencies.pop()
        })
        const secondListener = jest.fn()

        listener.addChangeListener(firstListener)
        listener.addChangeListener(secondListener)
        listener.emitChanges([UnistyleDependency.Theme, UnistyleDependency.ThemeName])

        expect(firstListenerCalls).toEqual([[UnistyleDependency.Theme, UnistyleDependency.ThemeName]])
        expect(secondListener).toHaveBeenCalledWith([UnistyleDependency.Theme, UnistyleDependency.ThemeName])
    })
})
