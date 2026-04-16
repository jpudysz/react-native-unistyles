import { removeInlineStyles, UNISTYLES_METADATA_KEYS } from '../web/utils'

describe('removeInlineStyles', () => {
    it('keeps CSS style properties enumerable', () => {
        const input = { width: 100, height: 200, backgroundColor: 'red' }
        const result = removeInlineStyles(input as any)

        // Enumerable — visible to Object.keys, Object.assign, spread, for...in
        expect(Object.keys(result)).toEqual(expect.arrayContaining(['width', 'height', 'backgroundColor']))
        expect({ ...result }).toEqual({ width: 100, height: 200, backgroundColor: 'red' })
        expect(Object.assign({}, result)).toEqual({ width: 100, height: 200, backgroundColor: 'red' })
    })

    it('keeps metadata keys non-enumerable', () => {
        const input = {
            width: 100,
            variants: { size: { large: { width: 200 } } },
            compoundVariants: [],
            _web: { cursor: 'pointer' },
            uni__dependencies: [1, 2],
            _classNames: 'foo',
        }
        const result = removeInlineStyles(input as any)

        const enumKeys = Object.keys(result)

        // CSS property is enumerable
        expect(enumKeys).toContain('width')

        // Metadata keys are NOT enumerable
        for (const metaKey of UNISTYLES_METADATA_KEYS) {
            expect(enumKeys).not.toContain(metaKey)
        }

        // But metadata keys still exist (accessible via direct access)
        expect((result as any).variants).toEqual(input.variants)
        expect((result as any)._web).toEqual(input._web)
    })

    it('works with StyleSheet.flatten and spread (third-party compat)', () => {
        const input = {
            width: '100%',
            height: 300,
            variants: { color: { red: { backgroundColor: 'red' } } },
        }
        const result = removeInlineStyles(input as any)

        // Simulates what StyleSheet.flatten / Object.assign does
        const flattened = Object.assign({}, result)
        expect(flattened).toEqual({ width: '100%', height: 300 })
        expect(flattened).not.toHaveProperty('variants')
    })
})
