import { convertToCSS } from '../web/css/core'
import { CSSState } from '../web/css/state'

const createState = () => new CSSState({} as never)

describe('Web pointerEvents', () => {
    it('emits box-none as none on the element and auto on its descendants', () => {
        const state = createState()

        convertToCSS('hash', { pointerEvents: 'box-none' }, state)

        expect(state.getStyles()).toBe('.hash{pointer-events:none!important;}.hash *{pointer-events:auto;}')
    })

    it('emits box-only as auto on the element and none on its children', () => {
        const state = createState()

        convertToCSS('hash', { pointerEvents: 'box-only' }, state)

        expect(state.getStyles()).toBe('.hash{pointer-events:auto!important;}.hash>*{pointer-events:none;}')
    })

    it('marks auto and none as important so they win over an ancestor box-none rule', () => {
        const state = createState()

        convertToCSS('auto', { pointerEvents: 'auto' }, state)
        convertToCSS('none', { pointerEvents: 'none' }, state)

        expect(state.getStyles()).toBe('.auto{pointer-events:auto!important;}.none{pointer-events:none!important;}')
    })

    it('applies the child rule inside media queries', () => {
        const state = createState()

        convertToCSS('hash', { landscape: { pointerEvents: 'box-none' } }, state)

        expect(state.getStyles()).toBe(
            '@media (orientation: landscape){.hash{pointer-events:none!important;}.hash *{pointer-events:auto;}}',
        )
    })

    it('removes the child rules together with the style', () => {
        const state = createState()

        convertToCSS('boxNone', { pointerEvents: 'box-none' }, state)
        convertToCSS('boxOnly', { pointerEvents: 'box-only' }, state)
        state.remove('boxNone')
        state.remove('boxOnly')

        expect(state.getStyles()).toBe('')
    })

    it('drops the previous child rule when the same style gets a new value', () => {
        const state = createState()

        convertToCSS('hash', { pointerEvents: 'box-none' }, state)
        convertToCSS('hash', { pointerEvents: 'none' }, state)

        expect(state.getStyles()).toBe('.hash{pointer-events:none!important;}')
    })

    it('removes pseudo-class rules and their child rules together with the style', () => {
        const state = createState()

        convertToCSS('hash', { _hover: { pointerEvents: 'box-none' } }, state)

        expect(state.getStyles()).toBe('.hash:hover{pointer-events:none!important;}.hash:hover *{pointer-events:auto;}')

        state.remove('hash')

        expect(state.getStyles()).toBe('')
    })
})
