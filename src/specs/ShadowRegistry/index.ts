import { NitroModules } from 'react-native-nitro-modules'
import type { UnistylesShadowRegistry as UnistylesShadowRegistrySpec } from './ShadowRegistry.nitro'
import type { ShadowNode, Unistyle, ViewHandle } from './types'

type Variants = Record<string, string | boolean | undefined>

interface ShadowRegistry extends UnistylesShadowRegistrySpec {
    // Babel API
    add(handle?: ViewHandle, styles?: Array<Unistyle>): void,
    remove(handle?: ViewHandle): void,
    // JSI
    link(node: ShadowNode, styles?: Array<Unistyle>): void,
    unlink(node: ShadowNode): void,
    selectVariants(variants?: Variants): void
}

const HybridShadowRegistry = NitroModules.createHybridObject<ShadowRegistry>('UnistylesShadowRegistry')

const findShadowNodeForHandle = (handle: ViewHandle) => {
    const node = handle?.__internalInstanceHandle?.stateNode?.node
        ?? handle?.getScrollResponder?.()?.getNativeScrollRef?.()?.__internalInstanceHandle?.stateNode?.node
        ?? handle?.getNativeScrollRef?.()?.__internalInstanceHandle?.stateNode?.node
        ?? handle?._viewRef?.__internalInstanceHandle?.stateNode?.node

    if (!node) {
        throw new Error(`Unistyles: Could not find shadow node for one of your components of type ${handle?.__internalInstanceHandle?.elementType ?? 'unknown'}`)
    }

    return node
}

HybridShadowRegistry.add = (handle, styles) => {
    // virtualized nodes can be null
    if (!handle || !styles || !Array.isArray(styles)) {
        return
    }

    // filter Reanimated styles and styles that are undefined
    const filteredStyles = styles
        .filter(style => !style?.initial?.updater)
        .filter(Boolean)

    HybridShadowRegistry.link(findShadowNodeForHandle(handle), filteredStyles)
}

HybridShadowRegistry.remove = handle => {
    if (!handle) {
        return
    }

    HybridShadowRegistry.unlink(findShadowNodeForHandle(handle))
}

type PrivateMethods =
    | 'add'
    | 'remove'
    | 'link'
    | 'unlink'

export const UnistylesShadowRegistry = HybridShadowRegistry as Omit<ShadowRegistry, PrivateMethods>
