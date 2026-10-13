import { convertToCSS } from '../web/css/core'
import { CSSState } from '../web/css/state'

const createState = () => new CSSState({} as never)

describe('Web pointerEvents', () => {
    it('emits box-none as none on the element and auto on its children', () => {
        const state = createState()

        convertToCSS('hash', { pointerEvents: 'box-none' }, state)

        expect(state.getStyles()).toBe('.hash{pointer-events:none;}:where(.hash)>*{pointer-events:auto;}')
    })

    it('emits box-only as auto on the element and none on its children', () => {
        const state = createState()

        convertToCSS('hash', { pointerEvents: 'box-only' }, state)

        expect(state.getStyles()).toBe('.hash{pointer-events:auto;}:where(.hash)>*{pointer-events:none;}')
    })

    it('keeps auto and none as they are', () => {
        const state = createState()

        convertToCSS('auto', { pointerEvents: 'auto' }, state)
        convertToCSS('none', { pointerEvents: 'none' }, state)

        expect(state.getStyles()).toBe(
            '.auto{pointer-events:auto;}:where(.auto)>*{}.none{pointer-events:none;}:where(.none)>*{}',
        )
    })

    it('applies the children rule inside media queries', () => {
        const state = createState()

        convertToCSS('hash', { landscape: { pointerEvents: 'box-none' } }, state)

        expect(state.getStyles()).toBe(
            '@media (orientation: landscape){.hash{pointer-events:none;}:where(.hash)>*{pointer-events:auto;}}',
        )
    })

    it('drops the children rule when the same style gets a new value', () => {
        const state = createState()

        convertToCSS('hash', { pointerEvents: 'box-none' }, state)
        convertToCSS('hash', { pointerEvents: 'none' }, state)

        expect(state.getStyles()).toBe('.hash{pointer-events:none;}:where(.hash)>*{}')
    })

    it('removes the children rule together with the style', () => {
        const state = createState()

        convertToCSS('hash', { pointerEvents: 'box-none' }, state)
        state.remove('hash')

        expect(state.getStyles()).toBe('')
    })
})
