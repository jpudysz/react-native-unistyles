const { addUnistylesImport, isInsideNodeModules } = require('./import')
const { hasStringRef } = require('./ref')
const { isUnistylesStyleSheet, analyzeDependencies, addStyleSheetTag, getUnistyles, isKindOfStyleSheet } = require('./stylesheet')
const { extractVariants } = require('./variants')

const reactNativeComponentNames = [
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

module.exports = function ({ types: t }) {
    return {
        name: 'babel-react-native-unistyles',
        visitor: {
            Program: {
                /** @param {import('./index').UnistylesPluginPass} state */
                enter(path, state) {
                    state.file.replaceWithUnistyles = REPLACE_WITH_UNISTYLES_PATHS
                        .concat(state.opts.autoProcessPaths ?? [])
                        .some(path => state.filename.includes(path))

                    state.file.hasAnyUnistyle = false
                    state.file.hasVariants = false
                    state.file.styleSheetLocalName = ''
                    state.file.tagNumber = 0
                    state.reactNativeImports = {}
                    state.file.forceProcessing = state.opts.autoProcessRoot
                        ? state.filename.includes(`${state.file.opts.root}/${state.opts.autoProcessRoot}/`)
                        : false
                },
                exit(path, state) {
                    if (isInsideNodeModules(state) && !state.file.replaceWithUnistyles) {
                        return
                    }

                    if (state.file.hasAnyUnistyle || state.file.hasVariants || state.file.replaceWithUnistyles || state.file.forceProcessing) {
                        addUnistylesImport(t, path, state)
                    }
                }
            },
            FunctionDeclaration(path, state) {
                if (isInsideNodeModules(state)) {
                    return
                }

                const componentName = path.node.id
                    ? path.node.id.name
                    : null

                if (componentName) {
                    state.file.hasVariants = false
                }
            },
            ClassDeclaration(path, state) {
                if (isInsideNodeModules(state)) {
                    return
                }

                const componentName = path.node.id
                    ? path.node.id.name
                    : null

                if (componentName) {
                    state.file.hasVariants = false
                }
            },
            VariableDeclaration(path, state) {
                if (isInsideNodeModules(state)) {
                    return
                }

                path.node.declarations.forEach((declaration) => {
                    if (t.isArrowFunctionExpression(declaration.init) || t.isFunctionExpression(declaration.init)) {
                        const componentName = declaration.id
                            ? declaration.id.name
                            : null

                        if (componentName) {
                            state.file.hasVariants = false
                        }
                    }
                })
            },
            /** @param {import('./index').UnistylesPluginPass} state */
            ImportDeclaration(path, state) {
                if (isInsideNodeModules(state) && !state.file.replaceWithUnistyles) {
                    return
                }

                const importSource = path.node.source.value

                if (importSource.includes('react-native-unistyles')) {
                    path.node.specifiers.forEach(specifier => {
                        if (specifier.imported && specifier.imported.name === 'StyleSheet') {
                            state.file.styleSheetLocalName = specifier.local.name
                        }
                    })
                }

                if (importSource === 'react-native') {
                    path.node.specifiers.forEach(specifier => {
                        if (specifier.imported && reactNativeComponentNames.includes(specifier.imported.name)) {
                            state.reactNativeImports[specifier.local.name] = specifier.imported.name
                        }
                    })
                }

                if (!state.file.forceProcessing && Array.isArray(state.opts.autoProcessImports)) {
                    state.file.forceProcessing = state.opts.autoProcessImports.includes(importSource)
                }
            },
            JSXElement(path, state) {
                if (isInsideNodeModules(state)) {
                    return
                }

                if (hasStringRef(t, path)) {
                    throw new Error("Detected string based ref which is not supported by Unistyles.")
                }
            },
            BlockStatement(path, state) {
                if (isInsideNodeModules(state)) {
                    return
                }

                extractVariants(t, path, state)
            },
            CallExpression(path, state) {
                if (isInsideNodeModules(state)) {
                    return
                }

                if (!isUnistylesStyleSheet(t, path, state) && !isKindOfStyleSheet(t, path, state)) {
                    return
                }

                state.file.hasAnyUnistyle = true

                addStyleSheetTag(t, path, state)

                const arg = path.node.arguments[0]

                // Object passed to StyleSheet.create
                if (t.isObjectExpression(arg)) {
                    arg.properties.forEach(property => {
                        if (t.isObjectProperty(property)) {
                            const propertyValues = getUnistyles(t, property)

                            propertyValues.forEach(propertyValue => {
                                analyzeDependencies(t, state, property.key.name, propertyValue)
                            })
                        }
                    })
                }

                // Function passed to StyleSheet.create (e.g., theme => ({ container: {} }))
                if (t.isArrowFunctionExpression(arg) || t.isFunctionExpression(arg)) {
                    const params = arg.params
                    const hasTheme = params.length >= 1
                    const hasMiniRuntime = params.length === 2
                    const themeLocalName = hasTheme
                        ? params[0].name
                        : undefined
                    const miniRuntimeLocalName = hasMiniRuntime
                        ? params[1].name
                        : undefined
                    const body = t.isBlockStatement(arg.body)
                        ? arg.body.body.find(statement => t.isReturnStatement(statement)).argument
                        : arg.body

                    // Ensure the function body returns an object
                    if (t.isObjectExpression(body)) {
                        body.properties.forEach(property => {
                            if (t.isObjectProperty(property)) {
                                const propertyValues = getUnistyles(t, property)

                                propertyValues.forEach(propertyValue => {
                                    analyzeDependencies(t, state, property.key.name, propertyValue, themeLocalName, miniRuntimeLocalName)
                                })
                            }
                        })
                    }
                }
            }
        }
    }
}
