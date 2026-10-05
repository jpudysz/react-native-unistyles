import type { NodePath } from '@babel/core'

import * as t from '@babel/types'

import type { RemapConfig } from '../index'
import type { UnistylesPluginPass } from './types'

import { getComponentPath } from './import'

export function handleExoticImport(
    path: NodePath<t.ImportDeclaration>,
    state: UnistylesPluginPass,
    exoticImport: Pick<RemapConfig, 'imports'>,
) {
    const specifiers = path.node.specifiers
    const source = path.node.source

    if (path.node.importKind !== 'value') {
        return
    }

    specifiers.forEach((specifier) => {
        for (const rule of exoticImport.imports) {
            const hasMatchingImportType =
                (!rule.isDefault && t.isImportSpecifier(specifier)) ||
                (rule.isDefault && t.isImportDefaultSpecifier(specifier))
            const isTypeOnly = t.isImportSpecifier(specifier) && specifier.importKind !== 'value'
            const hasMatchingImportName =
                rule.isDefault || (t.isImportSpecifier(specifier) && rule.name === getImportedName(specifier))
            const hasMatchingPath = rule.path === source.value

            if (isTypeOnly || !hasMatchingImportType || !hasMatchingImportName || !hasMatchingPath) {
                continue
            }

            if (t.isImportDefaultSpecifier(specifier)) {
                const newImport = t.importDeclaration(
                    [t.importDefaultSpecifier(t.identifier(specifier.local.name))],
                    t.stringLiteral(getComponentPath(state, rule.mapTo)),
                )

                path.replaceWith(newImport)
            } else {
                // keep the local name, so aliased and renamed imports (unstable_NativeText) stay bound
                const newImport = t.importDeclaration(
                    [t.importSpecifier(t.identifier(specifier.local.name), t.identifier(rule.mapTo))],
                    t.stringLiteral(getComponentPath(state, rule.mapTo)),
                )

                path.node.specifiers = path.node.specifiers.filter((s) => s !== specifier)

                if (path.node.specifiers.length === 0) {
                    path.replaceWith(newImport)
                } else {
                    path.insertBefore(newImport)
                }
            }

            return
        }
    })
}

function getImportedName(specifier: t.ImportSpecifier) {
    return t.isIdentifier(specifier.imported) ? specifier.imported.name : specifier.imported.value
}
