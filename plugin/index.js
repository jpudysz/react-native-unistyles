const addShadowRegistryImport = require('./import')
const { getStyleMetadata, getStyleAttribute, styleAttributeToArray, handlePressable } = require('./style')
const { getRefProp, addRef, overrideRef, hasStringRef } = require('./ref')
const { isUnistylesStyleSheet, analyzeDependencies, addStyleSheetTag, getUnistyle } = require('./stylesheet')
const { isUsingVariants, extractVariants } = require('./variants')

const reactNativeComponentNames = [
    'View',
    'Text',
    'Image',
    'ImageBackground',
    'KeyboardAvoidingView',
    'Modal',
    'Pressable',
    'ScrollView',
    'FlatList',
    'SectionList',
    'Switch',
    'Text',
    'TextInput',
    'TouchableHighlight',
    'TouchableOpacity',
    'TouchableWithoutFeedback',
    'VirtualizedList'
]

module.exports = function ({ types: t }) {
    return {
        name: 'babel-react-native-unistyles',
        visitor: {
            Program: {
                enter(path, state) {
                    state.file.hasAnyUnistyle = false
                    state.file.hasUnistylesImport = false
                    state.file.styleSheetLocalName = ''
                    state.file.tagNumber = 0
                    state.file.isClassComponent = false
                    state.reactNativeImports = {}
                },
                exit(path, state) {
                    if (state.file.hasAnyUnistyle) {
                        addShadowRegistryImport(t, path)
                    }
                }
            },
            FunctionDeclaration(path, state) {
                const componentName = path.node.id
                    ? path.node.id.name
                    : null

                if (componentName) {
                    state.file.hasVariants = false
                }
            },
            ClassDeclaration(path, state) {
                const componentName = path.node.id
                    ? path.node.id.name
                    : null

                if (componentName) {
                    state.file.hasVariants = false
                    state.file.isClassComponent = true
                }
            },
            VariableDeclaration(path, state) {
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
            ImportDeclaration(path, state) {
                const importSource = path.node.source.value

                if (importSource.includes('react-native-unistyles')) {
                    state.file.hasUnistylesImport = true

                    path.node.specifiers.forEach(specifier => {
                        if (specifier.imported && specifier.imported.name === 'StyleSheet') {
                            state.file.styleSheetLocalName = specifier.local.name
                        }
                    })
                }

                if (importSource.includes('react-native')) {
                    path.node.specifiers.forEach(specifier => {
                        if (specifier.imported && reactNativeComponentNames.includes(specifier.imported.name)) {
                            state.reactNativeImports[specifier.local.name] = true
                        }
                    })
                }
            },
            JSXElement(path, state) {
                if (state.file.isClassComponent) {
                    return
                }

                const openingElement = path.node.openingElement
                const openingElementName = openingElement.name.name
                const isReactNativeComponent = Boolean(state.reactNativeImports[openingElementName])
                const isAnimatedComponent = (
                    !isReactNativeComponent &&
                    openingElement.name.object &&
                    openingElement.name.object.name === 'Animated'
                )

                if (!isReactNativeComponent && !isAnimatedComponent) {
                    return
                }

                const styleAttr = getStyleAttribute(t, path)

                // component has no style prop
                if (!styleAttr) {
                    return
                }

                const metadata = getStyleMetadata(t, styleAttr.value.expression)

                // style prop is using unexpected expression
                if (metadata.length === 0) {
                    return
                }

                const uniquePressableId = openingElementName === 'Pressable'
                    ? handlePressable(t, path, styleAttr, metadata)
                    : undefined

                styleAttributeToArray(t, path)

                // to add import
                state.file.hasAnyUnistyle = true

                const refProp = getRefProp(t, path)

                if (!refProp && hasStringRef(t, path)) {
                    throw new Error("Detected string based ref which is not supported by Unistyles.")
                }

                refProp
                    ? overrideRef(t, path, refProp, metadata, state, uniquePressableId)
                    : addRef(t, path, metadata, state, uniquePressableId)
            },
            CallExpression(path, state) {
                if (isUsingVariants(t, path)) {
                    extractVariants(t, path, state)
                }

                if (!isUnistylesStyleSheet(t, path, state)) {
                    return
                }

                addStyleSheetTag(t, path, state)

                const arg = path.node.arguments[0]

                // Object passed to StyleSheet.create
                if (t.isObjectExpression(arg)) {
                    arg.properties.forEach(property => {
                        if (t.isObjectProperty(property)) {
                            const propertyValue = getUnistyle(t, property)

                            if (!propertyValue) {
                                return
                            }

                            analyzeDependencies(t, state, property.key.name, propertyValue)
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
                                const propertyValue = getUnistyle(t, property)

                                if (!propertyValue) {
                                    return
                                }

                                analyzeDependencies(t, state, property.key.name, propertyValue, themeLocalName, miniRuntimeLocalName)
                            }
                        })
                    }
                }
            }
        }
    }
}
