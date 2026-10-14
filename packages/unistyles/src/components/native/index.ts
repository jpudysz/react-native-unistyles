// react-native-unistyles/metro resolves every `react-native` import (react-native-web on web) to this module,
// so it exposes every export of react-native and swaps the components Unistyles can update.
// Imports from this folder are Unistyles' own, they reach the real react-native
const ReactNative: Record<string, unknown> = require('react-native')

// lazy, like react-native's own exports
const UNISTYLES_COMPONENTS: Record<string, () => unknown> = {
    ActivityIndicator: () => require('./ActivityIndicator').ActivityIndicator,
    Animated: () => require('./Animated').Animated,
    FlatList: () => require('./FlatList').FlatList,
    Image: () => require('./Image').Image,
    ImageBackground: () => require('./ImageBackground').ImageBackground,
    KeyboardAvoidingView: () => require('./KeyboardAvoidingView').KeyboardAvoidingView,
    Pressable: () => require('./Pressable').Pressable,
    RefreshControl: () => require('./RefreshControl').RefreshControl,
    SafeAreaView: () => require('./SafeAreaView').SafeAreaView,
    ScrollView: () => require('./ScrollView').ScrollView,
    SectionList: () => require('./SectionList').SectionList,
    Switch: () => require('./Switch').Switch,
    Text: () => require('./Text').Text,
    TextInput: () => require('./TextInput').TextInput,
    TouchableHighlight: () => require('./TouchableHighlight').TouchableHighlight,
    TouchableOpacity: () => require('./TouchableOpacity').TouchableOpacity,
    View: () => require('./View').View,
    VirtualizedList: () => require('./VirtualizedList').VirtualizedList,
    unstable_NativeText: () => require('./NativeText').NativeText,
    unstable_NativeView: () => require('./NativeView').NativeView,
}

// Object.keys doesn't call react-native's getters. Unistyles components are added even if missing,
// react-native-web and React Native before 0.83 don't export unstable_NativeView / unstable_NativeText
const exportNames = new Set(Object.keys(ReactNative).concat(Object.keys(UNISTYLES_COMPONENTS)))

exportNames.forEach((name) => {
    // CommonJS without the __esModule flag, like react-native, so a default import still gets every export
    // @ts-ignore module is provided by Metro
    Object.defineProperty(module.exports, name, {
        enumerable: true,
        get: UNISTYLES_COMPONENTS[name] ?? (() => ReactNative[name]),
    })
})
