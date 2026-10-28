// https://github.com/jpudysz/react-native-unistyles/issues/1309
import * as unistyles from '../web/services'

// Jest resolves the .native files by default
jest.mock('../core/getClassname', () => jest.requireActual('../core/getClassname.ts'))
jest.mock('../core/useProxifiedUnistyles', () => ({
    useProxifiedUnistyles: () => ({ proxifiedRuntime: {}, proxifiedTheme: {} }),
}))

const { withUnistyles } =
    require('../core/withUnistyles/withUnistyles.tsx') as typeof import('../core/withUnistyles/withUnistyles')

describe('withUnistyles web Reanimated animated styles', () => {
    const Component = () => null
    const UniComponent = withUnistyles(Component) as (props: Record<string, any>) => any
    const generated = { $$css: true, hash: 'unistyles_abc', injectedClassName: '' }
    const handle = { viewDescriptors: {}, initial: { value: { opacity: 0 }, updater: () => ({ opacity: 0 }) } }

    const render = (props: Record<string, any>) => {
        const wrapper = UniComponent(props)

        return { className: wrapper.props.className, props: wrapper.props.children.props }
    }

    beforeEach(() => {
        jest.spyOn(unistyles.services.shadowRegistry, 'addStyles').mockReturnValue({
            hash: generated.hash,
            injectedClassName: '',
            parsedStyles: {},
        } as never)
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })

    it('keeps the plain path unchanged', () => {
        const { className, props } = render({ style: { flex: 1 } })

        expect(className).toBe(generated.hash)
        expect(props.style).toStrictEqual({ flex: undefined })
    })

    it('passes animated styles to the component after the class', () => {
        const { className, props } = render({ style: [{ flex: 1 }, handle] })

        expect(className).toBe(generated.hash)
        expect(props.style).toStrictEqual([{ 0: undefined, 1: undefined, length: undefined }, handle])
        expect(props.style[1]).toBe(handle)
    })

    it('passes a single animated style to the component', () => {
        const { props } = render({ style: handle })

        expect(props.style[1]).toBe(handle)
    })
})
