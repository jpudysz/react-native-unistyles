import { NitroModules } from 'react-native-nitro-modules'
import type { UnistylesShadowRegistry as UnistylesShadowRegistrySpec } from './ShadowRegistry.nitro'
import type { ShadowNode, Unistyle, ViewHandle } from './types'

interface ShadowRegistry extends UnistylesShadowRegistrySpec {
    // Babel API
    add(handle?: ViewHandle, styles?: Array<Unistyle>): void
    remove(handle?: ViewHandle): void
    // JSI
    link(node: ShadowNode, styles?: Array<Unistyle>): void
    unlink(node: ShadowNode): void
    setScopedTheme(themeName?: string): void
    getScopedTheme(): string | undefined
}

const HybridShadowRegistry = NitroModules.createHybridObject<ShadowRegistry>('UnistylesShadowRegistry')

const findShadowNodeForHandle = (handle: ViewHandle) => {
    const node =
        handle?.__internalInstanceHandle?.stateNode?.node ??
        handle?.getScrollResponder?.()?.getNativeScrollRef?.()?.__internalInstanceHandle?.stateNode?.node ??
        handle?.getNativeScrollRef?.()?.__internalInstanceHandle?.stateNode?.node ??
        handle?._viewRef?.__internalInstanceHandle?.stateNode?.node ??
        handle?.viewRef?.current?.__internalInstanceHandle?.stateNode?.node ??
        handle?._nativeRef?.__internalInstanceHandle?.stateNode?.node

    if (!node) {
        throw new Error(
            `Unistyles: Could not find shadow node for one of your components of type ${handle?.__internalInstanceHandle?.elementType ?? 'unknown'}`,
        )
    }

    return node
}

HybridShadowRegistry.add = (handle, styles) => {
    // virtualized nodes can be null
    if (!handle || !styles) {
        return
    }

    const stylesArray = Array.isArray(styles) ? styles.flat() : [styles]

    // filter Reanimated styles and styles that are undefined
    const filteredStyles = stylesArray
        .filter(style => !style?.initial?.updater)
        .filter(style => style && Object.keys(style).length > 0)
        .flat()

    if (filteredStyles.length > 0) {
        HybridShadowRegistry.link(findShadowNodeForHandle(handle), filteredStyles)
    }
}

HybridShadowRegistry.remove = handle => {
    if (!handle) {
        return
    }

    HybridShadowRegistry.unlink(findShadowNodeForHandle(handle))
}

type PrivateMethods = 'add' | 'remove' | 'link' | 'unlink'

export const UnistylesShadowRegistry = HybridShadowRegistry as Omit<ShadowRegistry, PrivateMethods>
