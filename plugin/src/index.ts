import type { PluginItem } from '@babel/core'
import { isArrowFunctionExpression, isBlockStatement, isFunctionExpression, isIdentifier, isImportSpecifier, isObjectExpression, isObjectProperty, isReturnStatement } from '@babel/types'
import { NATIVE_COMPONENTS_PATHS, REACT_NATIVE_COMPONENT_NAMES, REPLACE_WITH_UNISTYLES_EXOTIC_PATHS, REPLACE_WITH_UNISTYLES_PATHS } from './consts'
import { handleExoticImport } from './exotic'
import { addUnistylesImport, isInsideNodeModules } from './import'
import { hasStringRef } from './ref'
import { addDependencies, addStyleSheetTag, getStylesDependenciesFromFunction, getStylesDependenciesFromObject, isKindOfStyleSheet, isUnistylesStyleSheet } from './stylesheet'
import type { UnistylesPluginPass } from './types'
import { extractVariants } from './variants'

export default function (): PluginItem {
    return {
        name: 'babel-react-native-unistyles',
        visitor: {
            Program: {
                enter(_, state: UnistylesPluginPass) {
                    state.file.replaceWithUnistyles = REPLACE_WITH_UNISTYLES_PATHS
                        .concat(state.opts.autoProcessPaths ?? [])
                        .some(path => state.filename?.includes(path))

                    state.file.hasAnyUnistyle = false
                    state.file.hasUnistylesImport = false
                    state.file.hasVariants = false
                    state.file.styleSheetLocalName = ''
                    state.file.tagNumber = 0
                    state.reactNativeImports = {}
                    state.file.forceProcessing = state.opts.autoProcessRoot && state.filename
                        ? state.filename.includes(`${state.file.opts.root}/${state.opts.autoProcessRoot}/`)
                        : false
                },
                exit(path, state: UnistylesPluginPass) {
                    if (isInsideNodeModules(state) && !state.file.replaceWithUnistyles) {
                        return
                    }

                    if (state.file.hasAnyUnistyle || state.file.hasVariants || state.file.replaceWithUnistyles || state.file.forceProcessing) {
                        addUnistylesImport(path, state)
                    }
                }
            },
            FunctionDeclaration(path, state: UnistylesPluginPass) {
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
            ClassDeclaration(path, state: UnistylesPluginPass) {
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
            VariableDeclaration(path, state: UnistylesPluginPass) {
                if (isInsideNodeModules(state)) {
                    return
                }

                path.node.declarations.forEach((declaration) => {
                    if (isArrowFunctionExpression(declaration.init) || isFunctionExpression(declaration.init)) {
                        const componentName = declaration.id && isIdentifier(declaration.id)
                            ? declaration.id.name
                            : null

                        if (componentName) {
                            state.file.hasVariants = false
                        }
                    }
                })
            },
            ImportDeclaration(path, state: UnistylesPluginPass) {
                const exoticImport = REPLACE_WITH_UNISTYLES_EXOTIC_PATHS
                    .concat(state.opts.autoRemapImports ?? [])
                    .find(exotic => state.filename?.includes(exotic.path))

                if (exoticImport) {
                    return handleExoticImport(path, state, exoticImport)
                }

                if (isInsideNodeModules(state) && !state.file.replaceWithUnistyles) {
                    return
                }

                const importSource = path.node.source.value

                if (importSource.includes('react-native-unistyles')) {
                    state.file.hasUnistylesImport = true

                    path.node.specifiers.forEach(specifier => {
                        if (isImportSpecifier(specifier) && isIdentifier(specifier.imported) && specifier.imported.name === 'StyleSheet') {
                            state.file.styleSheetLocalName = specifier.local.name
                        }
                    })
                }

                if (importSource === 'react-native') {
                    path.node.specifiers.forEach(specifier => {
                        if (isImportSpecifier(specifier) && isIdentifier(specifier.imported) && REACT_NATIVE_COMPONENT_NAMES.includes(specifier.imported.name)) {
                            state.reactNativeImports[specifier.local.name] = specifier.imported.name
                        }
                    })
                }

                if (importSource.includes('react-native/Libraries')) {
                    handleExoticImport(path, state, NATIVE_COMPONENTS_PATHS)
                }

                if (!state.file.forceProcessing && Array.isArray(state.opts.autoProcessImports)) {
                    state.file.forceProcessing = state.opts.autoProcessImports.includes(importSource)
                }
            },
            JSXElement(path, state: UnistylesPluginPass) {
                if (isInsideNodeModules(state)) {
                    return
                }

                if (hasStringRef(path)) {
                    throw new Error("Detected string based ref which is not supported by Unistyles.")
                }
            },
            BlockStatement(path, state: UnistylesPluginPass) {
                if (isInsideNodeModules(state)) {
                    return
                }

                extractVariants(path, state)
            },
            CallExpression(path, state: UnistylesPluginPass) {
                if (isInsideNodeModules(state)) {
                    return
                }

                if (!isUnistylesStyleSheet(path, state) && !isKindOfStyleSheet(path, state)) {
                    return
                }

                state.file.hasAnyUnistyle = true

                addStyleSheetTag(path, state)

                const arg = path.node.arguments[0]

                // Object passed to StyleSheet.create (may contain variants)
                if (isObjectExpression(arg)) {
                    const detectedDependencies = getStylesDependenciesFromObject(path)

                    if (detectedDependencies) {
                        if (isObjectExpression(arg)) {
                            arg.properties.forEach(property => {
                                if (isObjectProperty(property) && isIdentifier(property.key) && Object.prototype.hasOwnProperty.call(detectedDependencies, property.key.name)) {
                                    addDependencies(state, property.key.name, property, detectedDependencies[property.key.name] ?? [])
                                }
                            })
                        }
                    }
                }

                // Function passed to StyleSheet.create (e.g., theme => ({ container: {} }))
                if (isArrowFunctionExpression(arg) || isFunctionExpression(arg)) {
                    const detectedDependencies = getStylesDependenciesFromFunction(path)

                    if (detectedDependencies) {
                        const body = isBlockStatement(arg.body)
                            ? arg.body.body.find(statement => isReturnStatement(statement))?.argument
                            : arg.body

                        // Ensure the function body returns an object
                        if (isObjectExpression(body)) {
                            body.properties.forEach(property => {
                                if (isObjectProperty(property) && isIdentifier(property.key) && Object.prototype.hasOwnProperty.call(detectedDependencies, property.key.name)) {
                                    addDependencies(state, property.key.name, property, detectedDependencies[property.key.name] ?? [])
                                }
                            })
                        }
                    }
                }
            }
        }
    }
}
