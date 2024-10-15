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
    // virtualized nodes can be null
    if (!handle || !style) {
        return
    }

    // at this point unistyle can be only object or dynamic function
    if (typeof style !== 'object' && typeof style !== 'function') {
        return
    }

    if (!style.__unid) {
        console.warn(`Unistyles: Style is not bound!

Potential reasons:
a) You created a new Expo or React Native project that references StyleSheet from React Native
b) You used the spread operator on a Unistyle style outside of a JSX component
c) You're mixing StyleSheet styles from React Native with Unistyles

a) For new projects
If you're using a freshly generated project, replace StyleSheet imports from React Native with Unistyles:

- import { StyleSheet } from 'react-native'
+ import { StyleSheet } from 'react-native-unistyles'

b) Merging styles
If you need to merge styles, do it within the style prop of your JSX component:

style={{...styles.container, ...styles.otherProp}}
or
style={[styles.container, styles.otherProp]}

Copying a Unistyle style outside of a JSX element will remove its internal C++ state, leading to unexpected behavior.

c) Mixing styles
If you're mixing React Native and Unistyle StyleSheet styles, move your static styles into Unistyles to avoid conflicts.\n`)

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
