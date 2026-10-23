import { CSSState } from '../web/css/state'

jest.mock('../web/services', () => ({ services: { runtime: { breakpoints: { xs: 0, md: 768 } } } }))

const getStyles = (values: Record<string, any>) => {
    const state = new CSSState({ runtime: { breakpoints: { xs: 0, md: 768 } } } as never)

    state.add('hash', values)

    return state.getStyles()
}

describe('Web array style values', () => {
    it('joins every fontVariant entry', () => {
        expect(getStyles({ fontVariant: ['small-caps', 'tabular-nums'] })).toBe(
            '.hash{font-variant:small-caps tabular-nums;}',
        )
    })

    it('joins transformOrigin entries and adds px to numbers', () => {
        expect(getStyles({ transformOrigin: ['50%', 0, 10] })).toBe('.hash{transform-origin:50% 0px 10px;}')
    })

    it('keeps string values as they are', () => {
        expect(getStyles({ fontVariant: 'small-caps', transformOrigin: 'left top' })).toBe(
            '.hash{font-variant:small-caps;transform-origin:left top;}',
        )
    })

    it('joins array values inside breakpoints', () => {
        expect(getStyles({ fontVariant: { xs: ['small-caps'], md: ['small-caps', 'oldstyle-nums'] } })).toBe(
            '@media (min-width: 0px) and (max-width: 767px){.hash{font-variant:small-caps;}}' +
                '@media (min-width: 768px){.hash{font-variant:small-caps oldstyle-nums;}}',
        )
    })
})
