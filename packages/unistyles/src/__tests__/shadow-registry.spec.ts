jest.mock('react-native-nitro-modules', () => {
    const changeListeners: Array<(dependencies: Array<number>) => void> = []

    return {
        changeListeners,
        NitroModules: {
            createHybridObject: () => ({
                init: () => {},
                addChangeListener: (listener: (dependencies: Array<number>) => void) => {
                    changeListeners.push(listener)

                    return () => {}
                },
                link: () => {},
                unlink: () => {},
                suspend: () => {},
                takeCommittedInstanceHandles: () => [],
                refreshReactNodes: () => {},
            }),
        },
    }
})

import { UnistylesShadowRegistry } from '../specs/ShadowRegistry'
import { Tag, chain, fiber, frozenScreen, hostFiber, refOf, root } from './fiberFixtures'

const shadowRegistry = UnistylesShadowRegistry as unknown as {
    add: (handle: object, styles: Array<unknown>) => void
    remove: (handle: object) => void
    link: jest.Mock
    unlink: jest.Mock
    suspend: jest.Mock
    takeCommittedInstanceHandles: jest.Mock
    refreshReactNodes: jest.Mock
}

const { changeListeners } = jest.requireMock('react-native-nitro-modules') as {
    changeListeners: Array<(dependencies: Array<number>) => void>
}
const emitChange = () => changeListeners.forEach((listener) => listener([]))

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

describe('UnistylesShadowRegistry.remove on hidden views', () => {
    beforeEach(() => {
        shadowRegistry.unlink = jest.fn()
        shadowRegistry.suspend = jest.fn()
    })

    it('suspends a view removed inside a hidden Activity', () => {
        const node = {}
        const host = hostFiber(node)

        chain(host, fiber(Tag.Offscreen, { memoizedState: {} }), fiber(Tag.Activity), root())
        shadowRegistry.remove(refOf(host))

        expect(shadowRegistry.suspend.mock.calls).toStrictEqual([[node]])
        expect(shadowRegistry.unlink).not.toHaveBeenCalled()
    })

    it('suspends a view removed inside a frozen screen', () => {
        const node = {}
        const host = hostFiber(node)

        frozenScreen(host, root())
        shadowRegistry.remove(refOf(host))

        expect(shadowRegistry.suspend.mock.calls).toStrictEqual([[node]])
        expect(shadowRegistry.unlink).not.toHaveBeenCalled()
    })

    // a fallback is on screen, only the primary children are hidden
    it('unlinks a view removed from a Suspense fallback', () => {
        const node = {}
        const host = hostFiber(node)

        chain(host, fiber(Tag.Fragment), fiber(Tag.Suspense, { memoizedState: {} }), root())
        shadowRegistry.remove(refOf(host))

        expect(shadowRegistry.unlink.mock.calls).toStrictEqual([[node]])
        expect(shadowRegistry.suspend).not.toHaveBeenCalled()
    })
})

describe('UnistylesShadowRegistry change listener', () => {
    beforeEach(() => {
        shadowRegistry.refreshReactNodes = jest.fn()
    })

    const refreshedNodes = () => shadowRegistry.refreshReactNodes.mock.calls.flatMap((call) => call[0]) as Array<object>

    it('refreshes each visible host ancestor once and skips hidden ones', () => {
        const nodes = { a: {}, b: {}, frozen: {}, parent: {}, screen: {} }
        const top = root()
        const parent = hostFiber(nodes.parent)
        const a = hostFiber(nodes.a)
        const b = hostFiber(nodes.b)
        const frozen = hostFiber(nodes.frozen)
        const screen = hostFiber(nodes.screen)

        chain(parent, top)
        chain(a, parent)
        chain(b, parent)
        chain(screen, top)
        frozenScreen(frozen, screen)
        shadowRegistry.takeCommittedInstanceHandles = jest.fn(() => [a, b, frozen])

        emitChange()

        const refreshed = refreshedNodes()

        expect(new Set(refreshed)).toStrictEqual(new Set([nodes.a, nodes.b, nodes.parent]))
        expect(refreshed).toHaveLength(3)
    })

    it('refreshes both nodes of a view while a render is in flight', () => {
        const node = {}
        const inFlightNode = {}
        const host = hostFiber(node)

        host.alternate = { ...host, stateNode: { ...host.stateNode, node: inFlightNode }, alternate: host }
        chain(host, root())
        shadowRegistry.takeCommittedInstanceHandles = jest.fn(() => [host])

        emitChange()

        expect(refreshedNodes()).toStrictEqual([node, inFlightNode])
    })

    it('refreshes views in a Suspense fallback', () => {
        const node = {}
        const host = hostFiber(node)

        chain(host, fiber(Tag.Fragment), fiber(Tag.Suspense, { memoizedState: {} }), root())
        shadowRegistry.takeCommittedInstanceHandles = jest.fn(() => [host])

        emitChange()

        expect(refreshedNodes()).toStrictEqual([node])
    })

    it('skips handles that were collected', () => {
        shadowRegistry.takeCommittedInstanceHandles = jest.fn(() => [null, undefined])

        emitChange()

        expect(shadowRegistry.refreshReactNodes).not.toHaveBeenCalled()
    })
})
