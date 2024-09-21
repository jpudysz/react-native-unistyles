import { NitroModules } from 'react-native-nitro-modules'
import type { UnistylesShadowRegistry as UnistylesShadowRegistrySpec } from './ShadowRegistry.nitro'
import type { ShadowNode, Unistyle, ViewHandle } from './types'

interface ShadowRegistry extends UnistylesShadowRegistrySpec {
    // Babel API
    add(handle?: ViewHandle, style?: Unistyle): void,
    remove(handle?: ViewHandle, style?: Unistyle): void,
    // JSI
    link(node: ShadowNode, style: Unistyle): void,
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

HybridShadowRegistry.add = (handle, style) => {
    if (!handle || !style?.__unid) {
        return
    }

    HybridShadowRegistry.link(findShadowNodeForHandle(handle), style)
}

HybridShadowRegistry.remove = (handle, style) => {
    if (!handle || !style?.__unid) {
        return
    }

    HybridShadowRegistry.unlink(findShadowNodeForHandle(handle), style)
}

// todo hide API
export const UnistylesShadowRegistry = HybridShadowRegistry as ShadowRegistry
