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
})
