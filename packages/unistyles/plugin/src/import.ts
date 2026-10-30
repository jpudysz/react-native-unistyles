import type { NodePath } from '@babel/core'

import * as t from '@babel/types'

import type { UnistylesPluginPass } from './types'

export function getComponentPath(state: UnistylesPluginPass, name: string): string {
    if (!state.opts.isLocal) {
        return `react-native-unistyles/components/native/${name}`
    }

    if (state.opts.localPath) {
        return `${state.opts.localPath}/src/components/native/${name}`
    }

    return (
        state.file.opts.filename
            ?.split('react-native-unistyles')
            .at(0)
            ?.concat(`react-native-unistyles/src/components/native/${name}`) ?? ''
    )
}

export function addUnistylesImport(path: NodePath<t.Program>, state: UnistylesPluginPass) {
    const localNames = Object.keys(state.reactNativeImports)
    const names = Object.values(state.reactNativeImports)
    const pairs = Object.entries(state.reactNativeImports)
    const nodesToRemove: Array<t.ImportDeclaration> = []

    // remove rn-imports
    path.node.body.forEach((node) => {
        // user might have multiple imports like import type, import
        if (t.isImportDeclaration(node) && node.source.value === 'react-native') {
            node.specifiers = node.specifiers.filter(
                (specifier) => !localNames.some((name) => name === specifier.local.name),
            )

            if (node.specifiers.length === 0) {
                nodesToRemove.push(node)
            }
        }
    })

    // remove RNWeb imports
    names.forEach((name) => {
        const rnWebImport = path.node.body.find(
            (node): node is t.ImportDeclaration =>
                t.isImportDeclaration(node) && node.source.value === `react-native-web/dist/exports/${name}`,
        )

        if (rnWebImport) {
            rnWebImport.specifiers = []
        }
    })

    // import components from react-native-unistyles
    pairs.forEach(([localName, name]) => {
        const newImport = t.importDeclaration(
            [t.importSpecifier(t.identifier(localName), t.identifier(name))],
            t.stringLiteral(getComponentPath(state, name)),
        )

        path.node.body.unshift(newImport)
    })

    // cleanup
    nodesToRemove.forEach((node) => path.node.body.splice(path.node.body.indexOf(node), 1))
}

export function isInsideNodeModules(state: UnistylesPluginPass) {
    return state.file.opts.filename?.includes('node_modules') && !state.file.replaceWithUnistyles
}

export function addUnistylesRequire(path: NodePath<t.Program>, state: UnistylesPluginPass) {
    Object.entries(state.reactNativeImports).forEach(([componentName, uniqueName]) => {
        const newRequire = t.variableDeclaration('const', [
            t.variableDeclarator(
                t.identifier(uniqueName),
                t.callExpression(t.identifier('require'), [
                    t.stringLiteral(`react-native-unistyles/components/native/${componentName}`),
                ]),
            ),
        ])

        path.node.body.unshift(newRequire)
    })
}
