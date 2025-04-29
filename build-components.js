const fsPromise = require('node:fs/promises')
const fs = require('node:fs')

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
    'Animated',
    'NativeView',
    'NativeText'
]

fs.rmSync('./components', { recursive: true, force: true })
fs.mkdirSync('./components')
fs.mkdirSync('./components/native')

REACT_NATIVE_COMPONENT_NAMES.forEach(componentName => {
    fs.mkdirSync(`./components/native/${componentName}`)
    const hasNativeFile = fs.existsSync(`./src/components/native/${componentName}.native.tsx`)
    const packageJson = [
        '{',
        `  "main": "../../../lib/commonjs/components/native/${componentName}.js",`,
        `  "module": "../../../lib/module/components/native/${componentName}.js",`,
        `  "browser": "../../../lib/module/components/native/${componentName}.js",`,
        `  "react-native": "../../../src/components/native/${componentName}.${hasNativeFile ? 'native.' : ''}tsx"`,
        '}',
        ''
    ].join('\n')
    fs.writeFileSync(`./components/native/${componentName}/package.json`, packageJson)
})
