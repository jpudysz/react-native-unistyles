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
    flush(): void
    setScopedTheme(themeName?: string): void
    getScopedTheme(): string | undefined
    setContainerBreakpointId(containerId?: number): void
    getContainerBreakpointId(): number | undefined
    updateContainerSize(containerId: number, width: number, height: number): void
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

    // @ts-ignore we don't know the type of handle
    if (!node && handle?.props?.horizontal && handle?.constructor?.name === 'FlatList') {
        throw new Error(
            'Unistyles: detected an unsupported FlatList with the horizontal prop. This will cause crashes on Android due to a bug in React Native core. Read more: https://github.com/facebook/react-native/issues/51601',
        )
    }

    if (!node) {
        throw new Error(
            `Unistyles: Could not find shadow node for one of your components of type ${handle?.constructor?.name ?? 'unknown'}`,
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

    // filter styles that are undefined or with no keys
    const filteredStyles = stylesArray
        .filter((style) => style && Object.keys(style).length > 0)
        .flat()
        .filter(Boolean)

    if (filteredStyles.length > 0) {
        HybridShadowRegistry.link(findShadowNodeForHandle(handle), filteredStyles)
    }
}

HybridShadowRegistry.remove = (handle) => {
    if (!handle) {
        return
    }

    HybridShadowRegistry.unlink(findShadowNodeForHandle(handle))
}

type PrivateMethods = 'add' | 'remove' | 'link' | 'unlink'

export const UnistylesShadowRegistry = HybridShadowRegistry as Omit<ShadowRegistry, PrivateMethods>
