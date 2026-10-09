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
    takeCommittedTags(): Array<number>
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

    // @ts-ignore we don't know the type of handle
    if (!node && handle?.props?.horizontal && handle?.constructor?.name === 'FlatList') {
        throw new Error(
            'Unistyles: detected an unsupported FlatList with the horizontal prop. This will cause crashes on Android due to a bug in React Native core. Read more: https://github.com/facebook/react-native/issues/51601',
        )
    }

    return node
}

const getNativeTag = (handle: ViewHandle): number | undefined =>
    findFiberForHandle(handle)?.stateNode?.canonical?.nativeTag

// by native tag, weak: views unmounted while frozen never unlink, their dead refs are dropped when the map doubles
const linkedHandles = new Map<number, WeakRef<ViewHandle>>()
const MIN_SWEEP_SIZE = 256
let sweepSize = MIN_SWEEP_SIZE

const sweepUnmountedHandles = () => {
    linkedHandles.forEach((ref, tag) => {
        if (!ref.deref()) {
            linkedHandles.delete(tag)
        }
    })

    sweepSize = Math.max(MIN_SWEEP_SIZE, linkedHandles.size * 2)
}

const trackHandle = (handle: ViewHandle) => {
    const tag = getNativeTag(handle)

    // views re-link on every render
    if (tag === undefined || linkedHandles.get(tag)?.deref() === handle) {
        return
    }

    linkedHandles.set(tag, new WeakRef(handle))

    if (linkedHandles.size >= sweepSize) {
        sweepUnmountedHandles()
    }
}

const untrackHandle = (handle: ViewHandle) => {
    const tag = getNativeTag(handle)

    if (tag !== undefined && linkedHandles.get(tag)?.deref() === handle) {
        linkedHandles.delete(tag)
    }
}

// React re-attaches an untouched subtree through its root's node and only follows clones made on the JS thread.
// Once a node was cloned elsewhere (state updates, Reanimated), React would commit a subtree from before a Unistyles
// update, so after a Unistyles commit the committed nodes and their host ancestors must point at the committed tree
const refreshReactNodes = () => {
    const tags = HybridShadowRegistry.takeCommittedTags()

    if (tags.length === 0) {
        return
    }

    const nodes = new Set<ShadowNode>()
    const visited = new Set<any>()

    for (const tag of tags) {
        const handle = linkedHandles.get(tag)?.deref()

        if (!handle) {
            continue
        }

        const fiber = findFiberForHandle(handle)

        // hidden by Suspense or a frozen screen
        if (!fiber || isInsideSuspendedBoundary(fiber)) {
            continue
        }

        for (let current: any = fiber; current && !visited.has(current); current = current.return) {
            visited.add(current)

            if (current.alternate) {
                visited.add(current.alternate)
            }

            if (current.tag !== HOST_COMPONENT_TAG) {
                continue
            }

            for (const target of [current, current.alternate]) {
                const node = target?.stateNode?.node

                if (node) {
                    nodes.add(node)
                }
            }
        }
    }

    if (nodes.size > 0) {
        HybridShadowRegistry.refreshReactNodes(Array.from(nodes))
    }
}

StyleSheet.addChangeListener(refreshReactNodes)

// runs for every style on every link, so it allocates only for the rare merged style (eg. flattened by Animated)
const splitMergedUnistyles = (style: any) => {
    let hasUnistyle = false

    for (const key in style) {
        if (!key.startsWith('unistyles_') || !Object.prototype.hasOwnProperty.call(style, key)) {
            continue
        }

        if (hasUnistyle) {
            return Object.keys(style)
                .filter((unistyleKey) => unistyleKey.startsWith('unistyles_'))
                .map((unistyleKey) => ({ [unistyleKey]: style[unistyleKey] }))
        }

        hasUnistyle = true
    }

    return style
}

HybridShadowRegistry.add = (handle, styles, scope) => {
    // virtualized nodes can be null
    if (!handle || !styles) {
        return
    }

    const stylesArray = Array.isArray(styles) ? styles.flat(Infinity) : [styles]

    // filter styles that are undefined or with no keys
    const filteredStyles = stylesArray
        .filter((style) => style && Object.keys(style).length > 0)
        .filter(Boolean)
        .flatMap(splitMergedUnistyles)

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

        if (scope) {
            HybridShadowRegistry.setScopedTheme(previousScopedTheme)
        }

        trackHandle(handle)
    }
}

HybridShadowRegistry.remove = (handle) => {
    if (!handle) {
        return
    }

    const maybeNode = findShadowNodeForHandle(handle)

    if (maybeNode) {
        const fiber = findFiberForHandle(handle)

        if (fiber && isInsideSuspendedBoundary(fiber)) {
            HybridShadowRegistry.suspend(maybeNode)
        } else {
            HybridShadowRegistry.unlink(maybeNode)
            untrackHandle(handle)
        }
    }
}

type PrivateMethods = 'add' | 'remove' | 'link' | 'unlink' | 'suspend' | 'takeCommittedTags' | 'refreshReactNodes'

export const UnistylesShadowRegistry = HybridShadowRegistry as Omit<ShadowRegistry, PrivateMethods>
