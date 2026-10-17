import * as unistyles from '../web/services'

// Jest resolves getClassname.native.ts by default
const { getClassName } = require('../core/getClassname.ts') as typeof import('../core/getClassname')

describe('getClassName', () => {
    const generated = { $$css: true, hash: 'unistyles_abc', injectedClassName: '' }
    const handle = { viewDescriptors: {}, initial: { value: { opacity: 0 }, updater: () => ({ opacity: 0 }) } }

    afterEach(() => {
        jest.restoreAllMocks()
    })

    it('keeps styles added after an already generated style', () => {
        const addStyles = jest.spyOn(unistyles.services.shadowRegistry, 'addStyles')

        // createUnistylesElement(Animated.View): Reanimated replaces the handle with its initial values
        expect(getClassName([generated, { opacity: 0.5 }] as never)).toEqual([generated, [{ opacity: 0.5 }]])
        expect(getClassName([generated, [handle]] as never)).toEqual([generated, [handle]])
        expect(getClassName(generated as never)).toEqual([generated, []])
        expect(addStyles).not.toHaveBeenCalled()
    })

    it('generates a class for regular styles and keeps animated styles separate', () => {
        const addStyles = jest
            .spyOn(unistyles.services.shadowRegistry, 'addStyles')
            .mockReturnValue({ hash: 'unistyles_abc', injectedClassName: '', parsedStyles: {} } as never)

        expect(getClassName([{ flex: 1 }, handle] as never)).toEqual([generated, [handle]])
        expect(addStyles).toHaveBeenCalledWith([{ flex: 1 }], undefined)

        // Without a hash it's not a complete generated style
        getClassName([{ injectedClassName: 'custom' }, { opacity: 0.5 }] as never)
        expect(addStyles).toHaveBeenLastCalledWith([{ injectedClassName: 'custom' }, { opacity: 0.5 }], undefined)
    })
})
