jest.mock('react-native-nitro-modules', () => ({
    NitroModules: {
        createHybridObject: () => ({
            init: () => {},
            addChangeListener: () => () => {},
            link: () => {},
            unlink: () => {},
            suspend: () => {},
        }),
    },
}))

import { UnistylesShadowRegistry } from '../specs/ShadowRegistry'

const shadowRegistry = UnistylesShadowRegistry as unknown as {
    add: (handle: object, styles: Array<unknown>) => void
    remove: (handle: object) => void
    link: jest.Mock
    unlink: jest.Mock
}

const handleFor = (node: object) => ({
    __internalInstanceHandle: {
        stateNode: {
            node,
        },
    },
})

describe('UnistylesShadowRegistry.add', () => {
    it('should flatten style arrays nested deeper than three levels before linking', () => {
        const node = {}
        const link = jest.fn()

        shadowRegistry.link = link

        const styledText = { fontSize: 14 }
        const linkStyle = { color: 'blue' }
        const regular = { fontWeight: '400' }
        const bold = { fontWeight: '700' }
        const inline = { marginTop: 4 }

        shadowRegistry.add(handleFor(node), [styledText, [linkStyle, [regular, [bold, [inline, undefined]]]]])

        expect(link).toHaveBeenCalledTimes(1)
        expect(link.mock.calls[0]).toStrictEqual([node, [styledText, linkStyle, regular, bold, inline]])
    })

    it('should keep filtering out empty and undefined styles', () => {
        const node = {}
        const link = jest.fn()

        shadowRegistry.link = link

        const fontSize = { fontSize: 20 }

        shadowRegistry.add(handleFor(node), [undefined, {}, [[fontSize]]])

        expect(link.mock.calls[0]).toStrictEqual([node, [fontSize]])
    })
})

describe('UnistylesShadowRegistry.remove', () => {
    // FlatList on Android remounts its native ScrollView when `horizontal` changes,
    // so its scroll ref is already detached when the FlatList ref is cleaned up
    const flatListFor = (node: object) => {
        const flatList = {
            nativeScrollRef: handleFor(node) as object | null,
            props: { horizontal: false },
            getScrollResponder: () => ({
                getNativeScrollRef: () => flatList.nativeScrollRef,
            }),
        }

        return flatList
    }

    beforeEach(() => {
        shadowRegistry.link = jest.fn()
        shadowRegistry.unlink = jest.fn()
    })

    it('should unlink the linked node after the handle stopped resolving to it', () => {
        const node = { tag: 1 }
        const flatList = flatListFor(node)

        shadowRegistry.add(flatList, [{ height: 200 }])

        flatList.nativeScrollRef = null
        flatList.props.horizontal = true

        expect(() => shadowRegistry.remove(flatList)).not.toThrow()
        expect(shadowRegistry.unlink.mock.calls).toStrictEqual([[node]])
    })

    it('should not unlink the node the handle resolves to now', () => {
        const node = { tag: 1 }
        const nextNode = { tag: 2 }
        const flatList = flatListFor(node)

        shadowRegistry.add(flatList, [{ height: 200 }])

        flatList.nativeScrollRef = handleFor(nextNode)

        shadowRegistry.remove(flatList)

        expect(shadowRegistry.unlink.mock.calls).toStrictEqual([[node]])
    })

    it('should resolve the node of a handle that was never linked', () => {
        const node = { tag: 1 }
        const handle = handleFor(node)

        shadowRegistry.add(handle, [undefined])
        shadowRegistry.remove(handle)

        expect(shadowRegistry.link).not.toHaveBeenCalled()
        expect(shadowRegistry.unlink.mock.calls).toStrictEqual([[node]])
    })

    it('should forget the linked node after removing it', () => {
        const node = { tag: 1 }
        const flatList = flatListFor(node)

        shadowRegistry.add(flatList, [{ height: 200 }])
        shadowRegistry.remove(flatList)

        flatList.nativeScrollRef = null
        shadowRegistry.remove(flatList)

        expect(shadowRegistry.unlink.mock.calls).toStrictEqual([[node]])
    })
})
