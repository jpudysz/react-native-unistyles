import { NitroModules } from 'react-native-nitro-modules'

import type { Scope } from '../../components/ScopedThemeContext'
import type { VerifyReport } from '../../diagnostics/types'
import type { UnistylesShadowRegistry as UnistylesShadowRegistrySpec } from './ShadowRegistry.nitro'
import type { ShadowNode, Unistyle, ViewHandle } from './types'

import { StyleSheet } from '../StyleSheet'

interface ShadowRegistry extends UnistylesShadowRegistrySpec {
    // Babel API
    add(handle?: ViewHandle, styles?: Array<Unistyle>, scope?: Scope | null): void
    remove(handle?: ViewHandle): void
    // JSI
    link(node: ShadowNode, styles?: Array<Unistyle>): void
    unlink(node: ShadowNode): void
    suspend(node: ShadowNode): void
    flush(): void
    setScopedTheme(themeName?: string): void
    getScopedTheme(): string | undefined
    verify(): VerifyReport
    takeCommittedInstanceHandles(): Array<any>
    refreshReactNodes(nodes: Array<ShadowNode>): void
}

const HybridShadowRegistry = NitroModules.createHybridObject<ShadowRegistry>('UnistylesShadowRegistry')

const HOST_COMPONENT_TAG = 5
const SUSPENSE_TAG = 13
const OFFSCREEN_TAG = 22

const isInsideSuspendedBoundary = (fiber: any): boolean => {
    let current = fiber?.return

    while (current) {
        if ((current.tag === SUSPENSE_TAG || current.tag === OFFSCREEN_TAG) && current.memoizedState !== null) {
            return true
        }

        current = current.return
    }

    return false
}

const findFiberForHandle = (handle: ViewHandle) => {
    return (
        handle?.__internalInstanceHandle ??
        handle?.getScrollResponder?.()?.getNativeScrollRef?.()?.__internalInstanceHandle ??
        handle?.getNativeScrollRef?.()?.__internalInstanceHandle ??
        handle?._viewRef?.__internalInstanceHandle ??
        handle?.viewRef?.current?.__internalInstanceHandle ??
        handle?._nativeRef?.__internalInstanceHandle
    )
}

const findShadowNodeForHandle = (handle: ViewHandle) => {
    const node =
        handle?.__internalInstanceHandle?.stateNode?.node ??
        handle?.getScrollResponder?.()?.getNativeScrollRef?.()?.__internalInstanceHandle?.stateNode?.node ??
        handle?.getNativeScrollRef?.()?.__internalInstanceHandle?.stateNode?.node ??
        handle?._viewRef?.__internalInstanceHandle?.stateNode?.node ??
        handle?.viewRef?.current?.__internalInstanceHandle?.stateNode?.node ??
        handle?._nativeRef?.__internalInstanceHandle?.stateNode?.node

    return node
}

// A component can point at another native view by the time its ref is cleaned up, eg. FlatList on Android remounts
// its native ScrollView when `horizontal` changes, so remove unlinks the fiber it was linked with
// The fiber points at its current node, while a stored node would keep its first revision (and children) alive
// Native views always resolve to their own node, so they skip it
const linkedFibers = new WeakMap<object, any>()

// React re-attaches an untouched subtree through its root's node and only follows clones made on the JS thread.
// Once a node was cloned elsewhere (state updates, Reanimated), React would commit a subtree from before a Unistyles
// update, so after a Unistyles commit the committed nodes and their host ancestors must point at the committed tree
const refreshReactNodes = () => {
    const fibers = HybridShadowRegistry.takeCommittedInstanceHandles()

    if (fibers.length === 0) {
        return
    }

    const nodes: Array<ShadowNode> = []
    const refreshedTags = new Set<number>()
    const hostFibers: Array<any> = []

    for (const fiber of fibers) {
        // collected, unmounted since
        if (!fiber) {
            continue
        }

        let isHidden = false

        hostFibers.length = 0

        for (let current: any = fiber; current; current = current.return) {
            // hidden by Suspense or a frozen screen
            if ((current.tag === SUSPENSE_TAG || current.tag === OFFSCREEN_TAG) && current.memoizedState !== null) {
                isHidden = true
            }

            if (current.tag !== HOST_COMPONENT_TAG) {
                continue
            }

            // its ancestors are visible and already collected
            if (refreshedTags.has(current.stateNode?.canonical?.nativeTag)) {
                break
            }

            hostFibers.push(current)
        }

        if (isHidden) {
            continue
        }

        for (const hostFiber of hostFibers) {
            const node = hostFiber.stateNode?.node
            const alternateNode = hostFiber.alternate?.stateNode?.node
            const hostTag = hostFiber.stateNode?.canonical?.nativeTag

            if (hostTag !== undefined) {
                refreshedTags.add(hostTag)
            }

            if (node) {
                nodes.push(node)
            }

            if (alternateNode && alternateNode !== node) {
                nodes.push(alternateNode)
            }
        }
    }

    if (nodes.length > 0) {
        HybridShadowRegistry.refreshReactNodes(nodes)
    }
}

StyleSheet.addChangeListener(refreshReactNodes)

// skips empty styles and splits a style merged from many unistyles (eg. flattened by Animated) into one per unistyle
// runs for every style on every link, so it reads the keys once and allocates only for the rare merged style
const collectStyle = (style: any, collected: Array<any>) => {
    if (!style) {
        return
    }

    const keys = Object.keys(style)
    let unistylesCount = 0

    for (const key of keys) {
        if (key.startsWith('unistyles_')) {
            unistylesCount++
        }
    }

    if (unistylesCount < 2) {
        if (keys.length > 0) {
            collected.push(style)
        }

        return
    }

    for (const key of keys) {
        if (key.startsWith('unistyles_')) {
            collected.push({ [key]: style[key] })
        }
    }
}

HybridShadowRegistry.add = (handle, styles, scope) => {
    // virtualized nodes can be null
    if (!handle || !styles) {
        return
    }

    const filteredStyles: Array<any> = []

    if (Array.isArray(styles)) {
        styles.flat(Infinity).forEach((style) => collectStyle(style, filteredStyles))
    } else {
        collectStyle(styles, filteredStyles)
    }

    if (filteredStyles.length > 0) {
        const node = findShadowNodeForHandle(handle)

        if (!node) {
            throw new Error(
                `Unistyles: Could not find shadow node for one of your components of type ${handle?.constructor?.name ?? 'unknown'}`,
            )
        }

        // the view can link after its ScopedTheme rendered, when the registry is already restored
        const previousScopedTheme = scope ? HybridShadowRegistry.getScopedTheme() : undefined

        if (scope) {
            HybridShadowRegistry.setScopedTheme(scope.name)
        }

        HybridShadowRegistry.link(node, filteredStyles)

        if (!handle.__internalInstanceHandle) {
            linkedFibers.set(handle, findFiberForHandle(handle))
        }

        if (scope) {
            HybridShadowRegistry.setScopedTheme(previousScopedTheme)
        }
    }
}

HybridShadowRegistry.remove = (handle) => {
    if (!handle) {
        return
    }

    const linkedFiber = handle.__internalInstanceHandle ? undefined : linkedFibers.get(handle)
    const maybeNode = linkedFiber ? linkedFiber.stateNode?.node : findShadowNodeForHandle(handle)

    if (linkedFiber) {
        linkedFibers.delete(handle)
    }

    if (maybeNode) {
        const fiber = linkedFiber ?? findFiberForHandle(handle)

        if (fiber && isInsideSuspendedBoundary(fiber)) {
            HybridShadowRegistry.suspend(maybeNode)
        } else {
            HybridShadowRegistry.unlink(maybeNode)
        }
    }
}

type PrivateMethods =
    | 'add'
    | 'remove'
    | 'link'
    | 'unlink'
    | 'suspend'
    | 'takeCommittedInstanceHandles'
    | 'refreshReactNodes'

export const UnistylesShadowRegistry = HybridShadowRegistry as Omit<ShadowRegistry, PrivateMethods>
