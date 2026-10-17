import { NitroModules } from 'react-native-nitro-modules'

import type { Scope } from '../../components/ScopedThemeContext'
import type { VerifyReport } from '../../diagnostics/types'
import type { Host } from '../../unifiber/src'
import type { UnistylesShadowRegistry as UnistylesShadowRegistrySpec } from './ShadowRegistry.nitro'
import type { ShadowNode, Unistyle, ViewHandle } from './types'

import { Fiber, Reanimated } from '../../unifiber/src'
import { StyleSheet } from '../StyleSheet'
import { createUnistylesStyleSource } from './styleSource'

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

const { collectVisibleAncestors, getHostFor, getHostForInstanceHandle, getShadowNode, getShadowNodes, isHidden } = Fiber

const { source: styleSource, bumpEpoch } = createUnistylesStyleSource({
    get: () => HybridShadowRegistry.getScopedTheme(),
    set: (name) => HybridShadowRegistry.setScopedTheme(name),
})
const owners = Fiber.createOwnerRegistry(styleSource, [Reanimated.cssAdapter], (reason) => {
    console.warn(`Unistyles: ${reason}. CSS transitions won't follow theme changes.`)
})

// A component can point at another native view by the time its ref is cleaned up, eg. FlatList on Android remounts
// its native ScrollView when `horizontal` changes, so remove unlinks the view it was linked with
// The host points at its current node, while a stored node would keep its first revision (and children) alive
// Native views always resolve to their own host, so they skip it
const linkedHosts = new WeakMap<object, Host>()

const committedHosts: Array<Host | undefined> = []
let refreshNodes: Array<ShadowNode> = []

const collectShadowNodes = (host: Host) => {
    getShadowNodes(host, refreshNodes)
}

// React re-attaches an untouched subtree through its root's node and only follows clones made on the JS thread.
// Once a node was cloned elsewhere (state updates, Reanimated), React would commit a subtree from before a Unistyles
// update, so after a Unistyles commit the committed nodes and their host ancestors must point at the committed tree
const refreshReactNodes = () => {
    bumpEpoch()

    const handles = HybridShadowRegistry.takeCommittedInstanceHandles()

    if (handles.length === 0) {
        return
    }

    try {
        for (let i = 0; i < handles.length; i++) {
            committedHosts[i] = getHostForInstanceHandle(handles[i])
        }

        collectVisibleAncestors(committedHosts, collectShadowNodes)

        if (refreshNodes.length > 0) {
            HybridShadowRegistry.refreshReactNodes(refreshNodes)
        }

        owners.refresh(committedHosts)
    } finally {
        committedHosts.length = 0
        refreshNodes = []
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
        const host = getHostFor(handle)
        const node = host && getShadowNode(host)

        if (!host || !node) {
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
        owners.link(host)

        if (!handle.__internalInstanceHandle) {
            linkedHosts.set(handle, host)
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

    const linkedHost = handle.__internalInstanceHandle ? undefined : linkedHosts.get(handle)
    const host = linkedHost ?? getHostFor(handle)
    const maybeNode = host && getShadowNode(host)

    if (linkedHost) {
        linkedHosts.delete(handle)
    }

    if (host && maybeNode) {
        if (isHidden(host)) {
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
