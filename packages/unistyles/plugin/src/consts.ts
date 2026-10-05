import type { RemapConfig } from '../index'

export const REACT_NATIVE_COMPONENT_NAMES = [
    'ActivityIndicator',
    'View',
    'Text',
    'Image',
    'ImageBackground',
    'KeyboardAvoidingView',
    'Pressable',
    'ScrollView',
    'FlatList',
    'SectionList',
    'Switch',
    'TextInput',
    'RefreshControl',
    'TouchableHighlight',
    'TouchableOpacity',
    'VirtualizedList',
    'Animated',
    'SafeAreaView',
    // Modal - there is no exposed native handle
    // TouchableWithoutFeedback - can't accept a ref
]

/**
 * auto replace RN imports to Unistyles imports under these paths
 * our implementation simply borrows 'ref' to register it in ShadowRegistry
 * so we won't affect anyone's implementation
 */
export const REPLACE_WITH_UNISTYLES_PATHS = [
    'react-native-reanimated/src/component',
    'react-native-reanimated/lib/module/component',
]

/**
 * this is more powerful API as it allows to convert unmatched imports to Unistyles
 */
export const REPLACE_WITH_UNISTYLES_EXOTIC_PATHS: Array<RemapConfig> = []

/**
 * this list will additionally detect React Native direct imports
 * RN 0.83+ exposes host components from the package root, deep imports are gone in RN 0.87+
 */
export const NATIVE_COMPONENTS_PATHS: Pick<RemapConfig, 'imports'> = {
    imports: [
        {
            name: 'NativeText',
            isDefault: false,
            path: 'react-native/Libraries/Text/TextNativeComponent',
            mapTo: 'NativeText',
        },
        {
            isDefault: true,
            path: 'react-native/Libraries/Components/View/ViewNativeComponent',
            mapTo: 'NativeView',
        },
        {
            name: 'unstable_NativeText',
            isDefault: false,
            path: 'react-native',
            mapTo: 'NativeText',
        },
        {
            name: 'unstable_NativeView',
            isDefault: false,
            path: 'react-native',
            mapTo: 'NativeView',
        },
    ],
}
