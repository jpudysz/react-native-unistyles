import { NitroModules } from 'react-native-nitro-modules'
import type { UnistylesShadowRegistry as UnistylesShadowRegistrySpec } from './ShadowRegistry.nitro'
import type { ShadowNode, Unistyle, ViewHandle } from './types'

interface ShadowRegistry extends UnistylesShadowRegistrySpec {
    // Babel API
    add(handle?: ViewHandle, style?: Unistyle, variants?: Record<string, string | boolean>, args?: Array<any>): void,
    remove(handle?: ViewHandle, style?: Unistyle): void,
    // JSI
    link(node: ShadowNode, style?: Unistyle, variants?: Record<string, string | boolean>, args?: Array<any>): void,
    unlink(node: ShadowNode, style: Unistyle): void
}

const HybridShadowRegistry = NitroModules.createHybridObject<ShadowRegistry>('UnistylesShadowRegistry')

const findShadowNodeForHandle = (handle: ViewHandle) => {
    const node = handle?.__internalInstanceHandle?.stateNode?.node
        ?? handle?.getScrollResponder?.()?.getNativeScrollRef?.()?.__internalInstanceHandle?.stateNode?.node
        ?? handle?.getNativeScrollRef?.()?.__internalInstanceHandle?.stateNode?.node

    if (!node) {
        // todo extend log with file name / component name
        throw new Error('Could not find shadow node for one of your components')
    }

    return node
}

HybridShadowRegistry.add = (handle, style, variants, args) => {
    if (!handle || typeof style !== 'object') {
        return
    }

    HybridShadowRegistry.link(findShadowNodeForHandle(handle), style, variants ?? {}, args ?? [])
}

HybridShadowRegistry.remove = (handle, style) => {
    if (!handle || !style?.__unid) {
        return
    }

    HybridShadowRegistry.unlink(findShadowNodeForHandle(handle), style)
}

type PrivateMethods =
    | 'add'
    | 'remove'
    | 'link'
    | 'unlink'

export const UnistylesShadowRegistry = HybridShadowRegistry as Omit<ShadowRegistry, PrivateMethods>
