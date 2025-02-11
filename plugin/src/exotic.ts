import type { NodePath } from '@babel/core'
import { type ImportDeclaration, identifier, importDeclaration, importDefaultSpecifier, importSpecifier, isImportDefaultSpecifier, isImportSpecifier, stringLiteral } from '@babel/types'
import type { RemapConfig, UnistylesPluginPass } from './types'

export function handleExoticImport(path: NodePath<ImportDeclaration>, state: UnistylesPluginPass, exoticImport: Pick<RemapConfig, 'imports'>) {
    const specifiers = path.node.specifiers
    const source = path.node.source

    if (path.node.importKind !== 'value') {
        return
    }

    specifiers.forEach(specifier => {
        for (const rule of exoticImport.imports) {
            const hasMatchingImportType = (!rule.isDefault && isImportSpecifier(specifier)) || (rule.isDefault && isImportDefaultSpecifier(specifier))
            const hasMatchingImportName = rule.isDefault || (!rule.isDefault && rule.name === specifier.local.name)
            const hasMatchingPath = rule.path === source.value

            if (!hasMatchingImportType || !hasMatchingImportName || !hasMatchingPath) {
                continue
            }

            if (isImportDefaultSpecifier(specifier)) {
                const newImport = importDeclaration(
                    [importDefaultSpecifier(identifier(specifier.local.name))],
                    stringLiteral(state.opts.isLocal
                        ? state.file.opts.filename?.split('react-native-unistyles').at(0)?.concat(`react-native-unistyles/components/native/${rule.mapTo}`) ?? ''
                        : `react-native-unistyles/components/native/${rule.mapTo}`
                    )
                )

                path.replaceWith(newImport)
            } else {
                const newImport = importDeclaration(
                    [importSpecifier(identifier(rule.mapTo), identifier(rule.mapTo))],
                    stringLiteral(state.opts.isLocal
                        ? state.file.opts.filename?.split('react-native-unistyles').at(0)?.concat(`react-native-unistyles/components/native/${rule.mapTo}`) ?? ''
                        : `react-native-unistyles/components/native/${rule.mapTo}`
                    )
                )

                path.node.specifiers = specifiers.filter(s => s !== specifier)

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
