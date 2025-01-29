function handleExoticImport(t, path, state, exoticImport) {
    const specifiers = path.node.specifiers
    const source = path.node.source

    if (path.node.importKind !== 'value') {
        return
    }

    specifiers.forEach(specifier => {
        for (const rule of exoticImport.imports) {
            const hasMatchingImportType = !rule.isDefault || t.isImportDefaultSpecifier(specifier)
            const hasMatchingImportName = rule.name === specifier.local.name
            const hasMatchingPath = rule.path === source.value

            if (!hasMatchingImportType || !hasMatchingImportName || !hasMatchingPath) {
                continue
            }

            const newImport = t.importDeclaration(
                [t.importSpecifier(t.identifier(rule.mapTo), t.identifier(rule.mapTo))],
                t.stringLiteral(state.opts.isLocal
                    ? state.file.opts.filename.split('react-native-unistyles').at(0).concat(`react-native-unistyles/components/native/${rule.mapTo}`)
                    : `react-native-unistyles/components/native/${rule.mapTo}`
                )
            )

            // remove old import
            if (t.isImportDefaultSpecifier(specifier)) {
                path.replaceWith(newImport)
            } else {
                path.node.specifiers = specifiers.filter(s => s !== specifier)
                path.unshift(newImport)
            }

            return
        }
    })
}

module.exports = {
    handleExoticImport
}
