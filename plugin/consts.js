const REACT_NATIVE_COMPONENT_NAMES = [
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
const REPLACE_WITH_UNISTYLES_PATHS = [
    'react-native-reanimated/src/component',
    'react-native-gesture-handler/src/components'
]

// this is more powerful API as it allows to convert unmatched imports to Unistyles
// { path: string, imports: Array<{ name: string, isDefault: boolean, path: string, mapTo: string }> }
// name <- target import name
// isDefault <- is the import default?
// path <- path to the target import
// mapTo <- name of the Unistyles component
const REPLACE_WITH_UNISTYLES_EXOTIC_PATHS = []

module.exports = {
    REACT_NATIVE_COMPONENT_NAMES,
    REPLACE_WITH_UNISTYLES_PATHS,
    REPLACE_WITH_UNISTYLES_EXOTIC_PATHS
}
