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
    'Animated'
    // Modal - there is no exposed native handle
    // TouchableWithoutFeedback - can't accept a ref
]

// auto replace RN imports to Unistyles imports under these paths
// our implementation simply borrows 'ref' to register it in ShadowRegistry
// so we won't affect anyone's implementation
export const REPLACE_WITH_UNISTYLES_PATHS = [
    'react-native-reanimated/src/component',
    'react-native-gesture-handler/src/components'
]

// this is more powerful API as it allows to convert unmatched imports to Unistyles
// { path: string, imports: Array<{ name: string, isDefault: boolean, path: string, mapTo: string }> }
// path => node_modules path
// imports:
// name? <- target import name if isDefault is false
// isDefault <- is the import default?
// path <- path to the target import
// mapTo <- name of the Unistyles component
export const REPLACE_WITH_UNISTYLES_EXOTIC_PATHS = []

// this list will additionally detect React Native direct imports
export const NATIVE_COMPONENTS_PATHS = {
    imports: [
        {
            name: 'NativeText',
            isDefault: false,
            path: 'react-native/Libraries/Text/TextNativeComponent',
            mapTo: 'NativeText'
        },
        {
            isDefault: true,
            path: 'react-native/Libraries/Components/View/ViewNativeComponent',
            mapTo: 'NativeView'
        }
    ]
}
