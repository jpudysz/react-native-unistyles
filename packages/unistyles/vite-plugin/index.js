'use strict'
var __defProp = Object.defineProperty
var __getOwnPropDesc = Object.getOwnPropertyDescriptor
var __getOwnPropNames = Object.getOwnPropertyNames
var __hasOwnProp = Object.prototype.hasOwnProperty
var __export = (target, all) => {
    for (var name in all) __defProp(target, name, { get: all[name], enumerable: true })
}
var __copyProps = (to, from, except, desc) => {
    if ((from && typeof from === 'object') || typeof from === 'function') {
        for (let key of __getOwnPropNames(from))
            if (!__hasOwnProp.call(to, key) && key !== except)
                __defProp(to, key, {
                    get: () => from[key],
                    enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable,
                })
    }
    return to
}
var __toCommonJS = (mod) => __copyProps(__defProp({}, '__esModule', { value: true }), mod)

// vite-plugin/src/index.ts
var index_exports = {}
__export(index_exports, {
    unistyles: () => unistyles,
})
module.exports = __toCommonJS(index_exports)

// plugin/src/consts.ts
var REACT_NATIVE_COMPONENT_NAMES = [
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
var NATIVE_COMPONENTS_PATHS = {
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
    ],
}

// vite-plugin/src/index.ts
var nativeComponents = [
    ...REACT_NATIVE_COMPONENT_NAMES,
    ...NATIVE_COMPONENTS_PATHS.imports.map((component) => component.mapTo),
].map((component) => `react-native-unistyles/components/native/${component}`)
var unistyles = () => ({
    name: 'react-native-unistyles',
    configEnvironment() {
        return {
            optimizeDeps: {
                include: nativeComponents,
            },
        }
    },
})
// Annotate the CommonJS export names for ESM import in node:
0 &&
    (module.exports = {
        unistyles,
    })
