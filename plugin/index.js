const addShadowRegistryImport = require('./import')
const { getStyleObjectPath, getStyleAttribute } = require('./style')
const { getRefProp, addRef, overrideRef, hasStringRef } = require('./ref')
const { isUnistylesStyleSheet, analyzeDependencies } = require('./stylesheet')

module.exports = function ({ types: t }) {
    return {
        name: 'babel-react-native-unistyles',
        visitor: {
            Program: {
                enter(path, state) {
                    state.file.hasAnyUnistyle = false
                    state.file.hasUnistylesImport = false
                    state.file.styleSheetLocalName = ''
                    state.file.webDynamicFunctions = {}
                },
                exit(path, state) {
                    if (state.file.hasAnyUnistyle) {
                        addShadowRegistryImport(t, path)
                    }
                }
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
            },
            JSXElement(path, state) {
                if (!state.file.hasUnistylesImport) {
                    return
                }

                const styleAttr = getStyleAttribute(t, path)

                // component has no style prop
                if (!styleAttr) {
                    return
                }

                const stylePath = getStyleObjectPath(t, styleAttr.value.expression, state)

                // style prop is not using object expression
                if (stylePath.length !== 2) {
                    return
                }

                // to add import
                state.file.hasAnyUnistyle = true

                const refProp = getRefProp(t, path)

                if (!refProp && hasStringRef(t, path)) {
                    throw new Error("Detected string based ref which is not supported by Unistyles.")
                }

                const styleObj = stylePath[0]
                const styleProp = stylePath[1]

                refProp
                    ? overrideRef(t, path, refProp, styleObj, styleProp)
                    : addRef(t, path, styleObj, styleProp)
            },
            CallExpression(path, state) {
                if (!isUnistylesStyleSheet(t, path, state)) {
                    return
                }

                const arg = path.node.arguments[0]

                // Object passed to StyleSheet.create
                if (t.isObjectExpression(arg)) {
                    arg.properties.forEach(property => {
                        if (t.isObjectProperty(property)) {
                            const propertyValue = t.isArrowFunctionExpression(property.value)
                                ? property.value.body
                                : property.value

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
                                const propertyValue = t.isArrowFunctionExpression(property.value)
                                    ? property.value.body
                                    : property.value

                                analyzeDependencies(t, state, property.key.name, propertyValue, themeLocalName, miniRuntimeLocalName)
                            }
                        })
                    }
                }
            }
        }
    }
}