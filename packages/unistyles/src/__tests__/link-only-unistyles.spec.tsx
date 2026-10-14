// a view links only when its style holds a unistyle, the others render like React Native views (eg. 3rd party views)
import type React from 'react'

import { createUnistylesActivityIndicator } from '../core/createUnistylesActivityIndicator'
import { createUnistylesElement } from '../core/createUnistylesElement.native'
import { createUnistylesImageBackground } from '../core/createUnistylesImageBackground'
import { createUnistylesTouchableHighlight } from '../core/createUnistylesTouchableHighlight'
import { hasUnistyles } from '../core/hasUnistyles'

const mockAdd = jest.fn()
const mockRemove = jest.fn()

jest.mock('../specs', () => ({
    UnistylesShadowRegistry: {
        add: (...args: Array<unknown>) => mockAdd(...args),
        remove: (...args: Array<unknown>) => mockRemove(...args),
    },
}))

// the wrappers are rendered as plain functions, outside of React
jest.mock('react', () => {
    const actual = jest.requireActual('react')

    return {
        ...actual,
        useContext: () => null,
        useRef: (value: unknown) => ({ current: value }),
        useState: (value: unknown) => [value, () => {}],
        useCallback: (callback: unknown) => callback,
        useLayoutEffect: () => {},
    }
})

const UNISTYLE = { backgroundColor: 'red', unistyles_box: {} }
const PLAIN = { backgroundColor: 'blue' }

const Host = () => null

type Element = React.ReactElement<Record<string, any>>

const render = (Component: any, props: Record<string, unknown>) => Component(props) as Element

beforeEach(() => {
    mockAdd.mockClear()
    mockRemove.mockClear()
})

describe('hasUnistyles', () => {
    it.each([
        ['a unistyle', UNISTYLE, true],
        ['a unistyle in an array', [PLAIN, UNISTYLE], true],
        ['a unistyle in nested arrays', [PLAIN, [[undefined, [UNISTYLE]]]], true],
        ['a style merged from unistyles, eg. by Animated', { ...UNISTYLE, unistyles_text: {} }, true],
        ['a React Native style', PLAIN, false],
        ['React Native styles in arrays', [PLAIN, [{ margin: 4 }, null, false]], false],
        ['no style', undefined, false],
        ['a registered style id', 12, false],
    ])('should detect %s', (_, style, expected) => {
        expect(hasUnistyles(style)).toBe(expected)
    })

    it('should skip inherited keys, like the registry', () => {
        expect(hasUnistyles(Object.create({ unistyles_box: {} }))).toBe(false)
    })
})

describe.each([
    ['createUnistylesElement', createUnistylesElement(Host)],
    ['createUnistylesActivityIndicator', createUnistylesActivityIndicator(Host as any)],
    ['createUnistylesTouchableHighlight', createUnistylesTouchableHighlight(Host as any)],
])('%s', (_, Component) => {
    it("should keep the user's ref of a view without unistyles", () => {
        const ref = jest.fn()
        const onHideUnderlay = jest.fn()
        const element = render(Component, { style: [PLAIN], ref, onHideUnderlay })

        expect(element.props.ref).toBe(ref)
        expect(element.props.onHideUnderlay).toBe(onHideUnderlay)
        expect(mockAdd).not.toHaveBeenCalled()
    })

    it('should link a view with a unistyle and unlink it on cleanup', () => {
        const ref = jest.fn()
        const style = [PLAIN, UNISTYLE]
        const element = render(Component, { style, ref })

        expect(element.props.ref).not.toBe(ref)

        const host = { __internalInstanceHandle: { return: {} } }
        const cleanup = element.props.ref(host)

        expect(ref).toHaveBeenCalledWith(host)
        expect(mockAdd).toHaveBeenCalledWith(expect.anything(), style, null)

        cleanup()

        expect(mockRemove).toHaveBeenCalled()
    })
})

describe('createUnistylesImageBackground', () => {
    const ImageBackground = createUnistylesImageBackground(Host as any) as any
    const render = (props: Record<string, unknown>, forwardedRef: unknown) =>
        ImageBackground.render(props, forwardedRef) as Element

    it('should link the view and the image apart', () => {
        const forwardedRef = jest.fn()
        const imageRef = jest.fn()
        const withPlainView = render({ style: PLAIN, imageStyle: UNISTYLE, imageRef }, forwardedRef)

        expect(withPlainView.props.ref).toBe(forwardedRef)
        expect(withPlainView.props.imageRef).not.toBe(imageRef)

        const withPlainImage = render({ style: UNISTYLE, imageStyle: PLAIN, imageRef }, forwardedRef)

        expect(withPlainImage.props.ref).not.toBe(forwardedRef)
        expect(withPlainImage.props.imageRef).toBe(imageRef)
    })

    it('should link the image with a unistyle', () => {
        const element = render({ style: PLAIN, imageStyle: UNISTYLE }, null)
        const image = {}

        element.props.imageRef(image)()

        expect(mockAdd).toHaveBeenCalledWith(image, UNISTYLE, null)
        expect(mockRemove).toHaveBeenCalledWith(image)
    })
})
