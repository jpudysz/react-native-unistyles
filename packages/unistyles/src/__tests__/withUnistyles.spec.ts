import { getSecrets } from '../core/withUnistyles/withUnistyles.native'
import { UnistyleDependency } from '../specs/NativePlatform/NativePlatform.nitro'

jest.mock('../specs', () => ({ UnistylesShadowRegistry: {} }))

const nestedStyle = [{ color: 'black' }, [{ flex: 1 }, { fontSize: 17 }]]
const flatStyle = { color: 'black', flex: 1, fontSize: 17 }

describe('withUnistyles native nested styles', () => {
    it('flattens nested arrays, skips falsy values, and merges in order', () => {
        expect(
            getSecrets([null, false, [undefined, nestedStyle], [[[{ color: 'white', paddingTop: 4 }]]]]),
        ).toStrictEqual({
            styles: { ...flatStyle, color: 'white', paddingTop: 4 },
            dependencies: [],
        })
    })

    it('resolves nested Unistyles and returns their dependencies', () => {
        const unistyle = {
            unistyles_text: {
                uni__getStyles: () => ({ fontSize: 20 }),
                uni__dependencies: [UnistyleDependency.Theme, UnistyleDependency.Insets],
            },
        }

        expect(getSecrets([nestedStyle, [[unistyle]]])).toStrictEqual({
            styles: { ...flatStyle, fontSize: 20 },
            dependencies: [UnistyleDependency.Theme, UnistyleDependency.Insets],
        })
    })
})
