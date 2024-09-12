import { NitroModules } from 'react-native-nitro-modules'
import type { ShadowRegistry as ShadowRegistrySpec } from './ShadowRegistry.nitro'
import type { ViewHandle } from './types'

interface ShadowRegistry extends ShadowRegistrySpec {
    // Babel API
    add(style: object, handle: ViewHandle): void,
    remove(style: object, handle: ViewHandle): void,

    // JSI
    link(style: object, node: object): void,
    unlink(style: object, node: object): void
}

const HybridShadowRegistry = NitroModules.createHybridObject<ShadowRegistry>('ShadowRegistry')
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

HybridShadowRegistry.add = (style, handle) =>
    HybridShadowRegistry.link(style, findShadowNodeForHandle(handle))

HybridShadowRegistry.remove = (style, handle) =>
    HybridShadowRegistry.unlink(style, findShadowNodeForHandle(handle))

export {
    HybridShadowRegistry as ShadowRegistry
}
