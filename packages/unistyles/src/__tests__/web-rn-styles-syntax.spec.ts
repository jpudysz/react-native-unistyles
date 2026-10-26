import type { UnistylesRuntime } from '../web/runtime'

import { convertUnistyles } from '../web/convert'

const convert = (style: Record<string, any>) => convertUnistyles(style, {} as UnistylesRuntime)

describe('React Native array and object style syntaxes on web', () => {
    it('converts the fontVariationSettings object like processFontVariationSettings', () => {
        expect(convert({ fontVariationSettings: { wght: 650.5, slnt: -10 } })).toEqual({
            fontVariationSettings: "'slnt' -10, 'wght' 650.5",
        })
        expect(convert({ fontVariationSettings: "'wght' 700" })).toEqual({ fontVariationSettings: "'wght' 700" })
    })

    it('reads fontVariationSettings breakpoints holding the object syntax', () => {
        expect(convert({ fontVariationSettings: { xs: { wght: 400 }, md: "'wght' 700" } })).toEqual({
            xs: { fontVariationSettings: "'wght' 400" },
            md: { fontVariationSettings: "'wght' 700" },
        })
    })

    it('converts background size, position and repeat arrays to CSS', () => {
        expect(
            convert({
                backgroundSize: [{ x: 20, y: '50%' }, 'cover', { x: 'auto', y: 0 }],
                backgroundPosition: [
                    { top: 10, left: '20%' },
                    { bottom: 0, right: 5 },
                ],
                backgroundRepeat: [{ x: 'repeat', y: 'no-repeat' }],
            }),
        ).toEqual({
            backgroundSize: '20px 50%, cover, auto 0',
            backgroundPosition: 'left 20% top 10px, right 5px bottom 0',
            backgroundRepeat: 'repeat no-repeat',
        })
    })

    it('keeps background strings and reads breakpoints holding arrays', () => {
        expect(convert({ backgroundSize: '20px 20px' })).toEqual({ backgroundSize: '20px 20px' })
        expect(convert({ backgroundSize: { xs: [{ x: 10, y: 10 }], md: 'contain' } })).toEqual({
            xs: { backgroundSize: '10px 10px' },
            md: { backgroundSize: 'contain' },
        })
    })
})
