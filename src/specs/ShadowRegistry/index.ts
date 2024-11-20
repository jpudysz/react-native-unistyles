import { NitroModules } from 'react-native-nitro-modules'
import type { UnistylesShadowRegistry as UnistylesShadowRegistrySpec } from './ShadowRegistry.nitro'
import type { ShadowNode, Unistyle, ViewHandle } from './types'

interface ShadowRegistry extends UnistylesShadowRegistrySpec {
    // Babel API
    add(handle?: ViewHandle, styles?: Array<Unistyle>, variants?: Record<string, string | boolean>, args?: Array<Array<any>>, uniquePressableId?: string): void,
    remove(handle?: ViewHandle): void,
    // JSI
    link(node: ShadowNode, styles?: Array<Unistyle>, variants?: Record<string, string | boolean>, args?: Array<Array<any>>, uniquePressableId?: string): void,
    unlink(node: ShadowNode): void
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

HybridShadowRegistry.add = (handle, styles, variants, args, uniquePressableId) => {
    // virtualized nodes can be null
    if (!handle || !styles || !Array.isArray(styles)) {
        return
    }

    // filter Reanimated styles and styles that are undefined
    const filteredStyles = styles
        .filter(style => !style?.initial?.updater)
        .filter(Boolean)

    HybridShadowRegistry.link(findShadowNodeForHandle(handle), filteredStyles, variants ?? {}, args ?? [], uniquePressableId)
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
