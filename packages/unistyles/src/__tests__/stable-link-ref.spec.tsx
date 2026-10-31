// a view keeps the same ref function while its unistyles don't change. A new function makes React run the old one's
// cleanup and call the new one, which unlinked and linked the view again on every render
import type React from 'react'

import { createUnistylesElement } from '../core/createUnistylesElement.native'
import { getUnistylesKey } from '../core/getUnistylesKey'

const mockAdd = jest.fn()
const mockRemove = jest.fn()

jest.mock('../specs', () => ({
    UnistylesShadowRegistry: {
        add: (...args: Array<unknown>) => mockAdd(...args),
        remove: (...args: Array<unknown>) => mockRemove(...args),
    },
}))

let mockScope: unknown = null
// one component instance per test: keeps the last value while the deps are equal, like React
let mockMemo: { deps: Array<unknown>; value: unknown } | undefined

jest.mock('react', () => {
    const actual = jest.requireActual('react')

    return {
        ...actual,
        useContext: () => mockScope,
        useRef: (value: unknown) => ({ current: value }),
        useMemo: (factory: () => unknown, deps: Array<unknown>) => {
            const isSame =
                mockMemo !== undefined &&
                mockMemo.deps.length === deps.length &&
                deps.every((dep, index) => Object.is(dep, mockMemo?.deps[index]))

            if (!isSame) {
                mockMemo = { deps, value: factory() }
            }

            return mockMemo?.value
        },
    }
})

// a unistyle object, the value of its `unistyles_` key is what the registry reads
const unistyle = () => ({ backgroundColor: 'red', unistyles_box: {} })
const PLAIN = { margin: 4 }

const Host = () => null
const View = createUnistylesElement(Host)

type Element = React.ReactElement<Record<string, any>>

const render = (props: Record<string, unknown>) => View(props) as Element

beforeEach(() => {
    mockAdd.mockClear()
    mockRemove.mockClear()
    mockScope = null
    mockMemo = undefined
})

describe('getUnistylesKey', () => {
    it('should be empty without unistyles', () => {
        expect(getUnistylesKey(undefined)).toBe('')
        expect(getUnistylesKey([PLAIN, null, false, 12])).toBe('')
    })

    it('should be the same for the same unistyles in a new array', () => {
        const box = unistyle()

        expect(getUnistylesKey([PLAIN, box])).toBe(getUnistylesKey([box, { padding: 2 }]))
        expect(getUnistylesKey([[box]])).toBe(getUnistylesKey(box))
    })

    it('should change with another unistyle or another order', () => {
        const first = unistyle()
        const second = unistyle()

        expect(getUnistylesKey(first)).not.toBe(getUnistylesKey(second))
        expect(getUnistylesKey([first, second])).not.toBe(getUnistylesKey([second, first]))
    })

    it('should skip unistyle keys without an object, like the registry', () => {
        expect(getUnistylesKey({ unistyles_box: undefined })).toBe('')
        expect(getUnistylesKey(Object.create({ unistyles_box: {} }))).toBe('')
    })
})

describe('createUnistylesElement', () => {
    it('should keep the ref while the unistyles stay the same', () => {
        const box = unistyle()
        const first = render({ style: [PLAIN, box] })
        const second = render({ style: [{ margin: 8 }, box] })

        expect(second.props.ref).toBe(first.props.ref)
    })

    it('should give a new ref when a unistyle changes, eg. a dynamic function or new variants', () => {
        const first = render({ style: [PLAIN, unistyle()] })
        const second = render({ style: [PLAIN, unistyle()] })

        expect(second.props.ref).not.toBe(first.props.ref)
    })

    it('should give a new ref when a unistyle is added or removed', () => {
        const box = unistyle()
        const card = unistyle()
        const first = render({ style: [box, false] })
        const second = render({ style: [box, card] })

        expect(second.props.ref).not.toBe(first.props.ref)
    })

    it('should give a new ref when the scope changes', () => {
        const box = unistyle()
        const first = render({ style: box })

        mockScope = { name: 'dark' }

        const second = render({ style: box })

        expect(second.props.ref).not.toBe(first.props.ref)
    })

    it("should give a new ref when the user's ref changes", () => {
        const box = unistyle()
        const first = render({ style: box, ref: jest.fn() })
        const second = render({ style: box, ref: jest.fn() })

        expect(second.props.ref).not.toBe(first.props.ref)
    })

    it('should still link the view and pass it to the user', () => {
        const box = unistyle()
        const userRef = jest.fn()
        const style = [PLAIN, box]

        render({ style, ref: userRef })

        const element = render({ style: [box], ref: userRef })
        const host = {}
        const cleanup = element.props.ref(host)

        expect(userRef).toHaveBeenCalledWith(host)
        expect(mockAdd).toHaveBeenCalledWith(host, style, null)

        cleanup()

        expect(mockRemove).toHaveBeenCalledWith(host)
    })
})
