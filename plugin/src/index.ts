import type { PluginObj } from '@babel/core'

import * as t from '@babel/types'
import nodePath from 'node:path'

import type { UnistylesPluginPass } from './types'

import {
    NATIVE_COMPONENTS_PATHS,
    REACT_NATIVE_COMPONENT_NAMES,
    REPLACE_WITH_UNISTYLES_EXOTIC_PATHS,
    REPLACE_WITH_UNISTYLES_PATHS,
} from './consts'
import { handleExoticImport } from './exotic'
import { addUnistylesImport, addUnistylesRequire, isInsideNodeModules } from './import'
import { toPlatformPath } from './paths'
import { hasStringRef } from './ref'
import {
    addDependencies,
    addStyleSheetTag,
    getStylesDependenciesFromFunction,
    getStylesDependenciesFromObject,
    isKindOfStyleSheet,
    isReactNativeCommonJSRequire,
    isUnistylesCommonJSRequire,
    isUnistylesStyleSheet,
} from './stylesheet'
import { extractVariants } from './variants'

export default function (): PluginObj<UnistylesPluginPass> {
    if (process.env.NODE_ENV === 'test') {
        return {
            name: 'babel-react-native-unistyles',
            visitor: {},
        }
    }

    return {
        name: 'babel-react-native-unistyles',
        visitor: {
            Program: {
                enter(path, state) {
                    if (!state.opts.root) {
                        throw new Error(
                            'Unistyles 🦄: Babel plugin requires `root` option to be set. Please check https://www.unistyl.es/v3/other/babel-plugin#extra-configuration',
                        )
                    }

                    const appRoot = toPlatformPath(nodePath.join(state.file.opts.root as string, state.opts.root))

                    if (state.file.opts.root === appRoot) {
                        throw new Error(
                            "Unistyles 🦄: Root option can't resolve to project root as it will include node_modules folder. Please check https://www.unistyl.es/v3/other/babel-plugin#extra-configuration",
                        )
                    }

                    state.file.replaceWithUnistyles = REPLACE_WITH_UNISTYLES_PATHS.concat(
                        state.opts.autoProcessPaths ?? [],
                    )
                        .map(toPlatformPath)
                        .some((path) => state.filename?.includes(path))

                    state.file.hasAnyUnistyle = false
                    state.file.hasUnistylesImport = false
                    state.file.addUnistylesRequire = false
                    state.file.hasVariants = false
                    state.file.styleSheetLocalName = ''
                    state.file.reactNativeCommonJSName = ''
                    state.file.tagNumber = 0
                    state.reactNativeImports = {}
                    state.file.forceProcessing = state.filename?.includes(appRoot) ?? false

                    path.traverse({
                        BlockStatement(blockPath) {
                            if (isInsideNodeModules(state)) {
                                return
                            }

                            extractVariants(blockPath, state)
                        },
                    })
                },
                exit(path, state) {
                    if (isInsideNodeModules(state)) {
                        return
                    }

                    if (state.file.addUnistylesRequire) {
                        return addUnistylesRequire(path, state)
                    }

                    if (
                        state.file.hasAnyUnistyle ||
                        state.file.hasVariants ||
                        state.file.replaceWithUnistyles ||
                        state.file.forceProcessing
                    ) {
                        addUnistylesImport(path, state)
                    }
                },
            },
            FunctionDeclaration(path, state) {
                if (isInsideNodeModules(state)) {
                    return
                }

                const componentName = path.node.id ? path.node.id.name : null

                if (componentName) {
                    state.file.hasVariants = false
                }
            },
            ClassDeclaration(path, state) {
                if (isInsideNodeModules(state)) {
                    return
                }

                const componentName = path.node.id ? path.node.id.name : null

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
                        const componentName =
                            declaration.id && t.isIdentifier(declaration.id) ? declaration.id.name : null

                        if (componentName) {
                            state.file.hasVariants = false
                        }
                    }
                })
            },
            ImportDeclaration(path, state) {
                const exoticImport = REPLACE_WITH_UNISTYLES_EXOTIC_PATHS.concat(state.opts.autoRemapImports ?? []).find(
                    (exotic) => state.filename?.includes(exotic.path),
                )

                if (exoticImport) {
                    return handleExoticImport(path, state, exoticImport)
                }

                if (isInsideNodeModules(state)) {
                    return
                }

                const importSource = path.node.source.value

                if (importSource.includes('react-native-unistyles')) {
                    state.file.hasUnistylesImport = true

                    path.node.specifiers.forEach((specifier) => {
                        if (
                            t.isImportSpecifier(specifier) &&
                            t.isIdentifier(specifier.imported) &&
                            specifier.imported.name === 'StyleSheet'
                        ) {
                            state.file.styleSheetLocalName = specifier.local.name
                        }
                    })
                }

                if (importSource === 'react-native') {
                    path.node.specifiers.forEach((specifier) => {
                        if (
                            t.isImportSpecifier(specifier) &&
                            t.isIdentifier(specifier.imported) &&
                            REACT_NATIVE_COMPONENT_NAMES.includes(specifier.imported.name)
                        ) {
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
            JSXElement(path, state) {
                if (isInsideNodeModules(state)) {
                    return
                }

                if (hasStringRef(path)) {
                    throw new Error('Detected string based ref which is not supported by Unistyles.')
                }
            },
            MemberExpression(path, state) {
                if (isInsideNodeModules(state)) {
                    return
                }

                // is this is commonJS require from react-native or RNW?
                if (!state.file.reactNativeCommonJSName || !t.isIdentifier(path.node.object)) {
                    return
                }

                if (
                    path.node.object.name !== state.file.reactNativeCommonJSName ||
                    !t.isIdentifier(path.node.property)
                ) {
                    return
                }

                if (!REACT_NATIVE_COMPONENT_NAMES.includes(path.node.property.name)) {
                    return
                }

                if (!state.reactNativeImports[path.node.property.name]) {
                    const uniqueId = path.scope.generateUidIdentifier(`reactNativeUnistyles_${path.node.property.name}`)

                    state.reactNativeImports[path.node.property.name] = uniqueId.name
                    state.file.addUnistylesRequire = true
                }

                // override with unistyles components
                path.node.object.name = state.reactNativeImports[path.node.property.name] as string
            },
            CallExpression(path, state) {
                if (isInsideNodeModules(state)) {
                    return
                }

                if (isUnistylesCommonJSRequire(path, state)) {
                    return
                }

                if (isReactNativeCommonJSRequire(path, state)) {
                    return
                }

                if (!isUnistylesStyleSheet(path, state) && !isKindOfStyleSheet(path, state)) {
                    return
                }

                state.file.hasAnyUnistyle = true

                addStyleSheetTag(path, state)

                const arg = t.isAssignmentExpression(path.node.arguments[0])
                    ? path.node.arguments[0].right
                    : path.node.arguments[0]

                // Object passed to StyleSheet.create (may contain variants)
                if (t.isObjectExpression(arg)) {
                    const detectedDependencies = getStylesDependenciesFromObject(path)

                    if (detectedDependencies) {
                        if (t.isObjectExpression(arg)) {
                            arg.properties.forEach((property) => {
                                if (
                                    t.isObjectProperty(property) &&
                                    t.isIdentifier(property.key) &&
                                    Object.prototype.hasOwnProperty.call(detectedDependencies, property.key.name)
                                ) {
                                    addDependencies(
                                        state,
                                        property.key.name,
                                        property,
                                        detectedDependencies[property.key.name] ?? [],
                                    )
                                }
                            })
                        }
                    }
                }

                // Function passed to StyleSheet.create (e.g., theme => ({ container: {} }))
                if (t.isArrowFunctionExpression(arg) || t.isFunctionExpression(arg)) {
                    const funcPath = t.isAssignmentExpression(path.node.arguments[0])
                        ? path.get('arguments.0.right')
                        : path.get('arguments.0')
                    const detectedDependencies = getStylesDependenciesFromFunction(funcPath)

                    if (detectedDependencies) {
                        const body = t.isBlockStatement(arg.body)
                            ? arg.body.body.find((statement) => t.isReturnStatement(statement))?.argument
                            : arg.body

                        // Ensure the function body returns an object
                        if (t.isObjectExpression(body)) {
                            body.properties.forEach((property) => {
                                if (
                                    t.isObjectProperty(property) &&
                                    t.isIdentifier(property.key) &&
                                    Object.prototype.hasOwnProperty.call(detectedDependencies, property.key.name)
                                ) {
                                    addDependencies(
                                        state,
                                        property.key.name,
                                        property,
                                        detectedDependencies[property.key.name] ?? [],
                                    )
                                }
                            })
                        }
                    }
                }
            },
        },
    }
}
