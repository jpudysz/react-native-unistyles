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

                    state.file.isExcluded = Array.isArray(state.opts.excludePaths)
                        ? state.opts.excludePaths.map(toPlatformPath).some((p) => state.filename?.includes(p))
                        : false

                    if (state.file.isExcluded) {
                        return
                    }

                    state.file.hasAnyUnistyle = false
                    state.file.hasUnistylesImport = false
                    state.file.hasDynamicStyleSheet = false
                    state.file.addUnistylesRequire = false
                    state.file.hasVariants = false
                    state.file.styleSheetLocalName = ''
                    state.file.reactNativeCommonJSName = ''
                    state.reactNativeImports = {}
                    // forceProcessing is no longer set eagerly from the path match.
                    // It is activated in ImportDeclaration when a qualifying RN component
                    // import is detected — so files that only contain a static StyleSheet.create
                    // and no RN component imports produce zero output changes.
                    state.file.forceProcessing = false

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
                    if (state.file.isExcluded || isInsideNodeModules(state)) {
                        return
                    }

                    if (state.file.addUnistylesRequire) {
                        return addUnistylesRequire(path, state)
                    }

                    // If the file imported StyleSheet from react-native-unistyles but every
                    // StyleSheet.create call was purely static (no uni__dependencies injected),
                    // rewrite the import source to 'react-native' so the Unistyles registry is
                    // never involved for this file.
                    if (
                        state.file.hasUnistylesImport &&
                        state.file.styleSheetLocalName &&
                        !state.file.hasDynamicStyleSheet &&
                        !state.file.forceProcessing &&
                        !state.file.replaceWithUnistyles
                    ) {
                        path.node.body.forEach((node) => {
                            if (
                                t.isImportDeclaration(node) &&
                                node.source.value === 'react-native-unistyles' &&
                                node.specifiers.some(
                                    (s) =>
                                        t.isImportSpecifier(s) &&
                                        t.isIdentifier(s.imported) &&
                                        s.imported.name === 'StyleSheet',
                                )
                            ) {
                                // Collect any non-StyleSheet specifiers that should stay on unistyles
                                const otherSpecifiers = node.specifiers.filter(
                                    (s) =>
                                        !(
                                            t.isImportSpecifier(s) &&
                                            t.isIdentifier(s.imported) &&
                                            s.imported.name === 'StyleSheet'
                                        ),
                                )
                                const styleSheetSpecifiers = node.specifiers.filter(
                                    (s) =>
                                        t.isImportSpecifier(s) &&
                                        t.isIdentifier(s.imported) &&
                                        s.imported.name === 'StyleSheet',
                                )

                                if (otherSpecifiers.length > 0) {
                                    // Keep unistyles import for other named exports; add separate RN import
                                    node.specifiers = otherSpecifiers
                                    const rnImport = t.importDeclaration(
                                        styleSheetSpecifiers,
                                        t.stringLiteral('react-native'),
                                    )
                                    path.node.body.splice(path.node.body.indexOf(node) + 1, 0, rnImport)
                                } else {
                                    // Only StyleSheet was imported — rewrite the source in place
                                    node.source = t.stringLiteral('react-native')
                                }
                            }
                        })

                        return
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
                if (state.file.isExcluded || isInsideNodeModules(state)) {
                    return
                }

                const componentName = path.node.id ? path.node.id.name : null

                if (componentName) {
                    state.file.hasVariants = false
                }
            },
            ClassDeclaration(path, state) {
                if (state.file.isExcluded || isInsideNodeModules(state)) {
                    return
                }

                const componentName = path.node.id ? path.node.id.name : null

                if (componentName) {
                    state.file.hasVariants = false
                }
            },
            VariableDeclaration(path, state) {
                if (state.file.isExcluded || isInsideNodeModules(state)) {
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
                if (state.file.isExcluded) {
                    return
                }

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
                            // activate forceProcessing only when there are actual RN components
                            // to rewrite — not just because the file is inside root
                            state.file.forceProcessing = true
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
                if (state.file.isExcluded || isInsideNodeModules(state)) {
                    return
                }

                if (hasStringRef(path)) {
                    throw new Error('Detected string based ref which is not supported by Unistyles.')
                }
            },
            MemberExpression(path, state) {
                if (state.file.isExcluded || isInsideNodeModules(state)) {
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
                if (state.file.isExcluded || isInsideNodeModules(state)) {
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
