/** @param {import('./index').UnistylesPluginPass} state */
function addUnistylesImport(t, path, state) {
    const localNames = Object.keys(state.reactNativeImports)
    const names = Object.values(state.reactNativeImports)
    const pairs = Object.entries(state.reactNativeImports)
    const nodesToRemove = []

    // remove rn-imports
    path.node.body.forEach(node => {
        // user might have multiple imports like import type, import
        if (t.isImportDeclaration(node) && node.source.value === 'react-native') {
            node.specifiers = node.specifiers.filter(specifier => !localNames.some(name => name === specifier.local.name))

            if (node.specifiers.length === 0) {
                nodesToRemove.push(node)
            }
        }
    })

    // remove RNWeb imports
    names.forEach(name => {
        const rnWebImport = path.node.body.find(node => t.isImportDeclaration(node) && node.source.value === `react-native-web/dist/exports/${name}`)

        if (rnWebImport) {
            rnWebImport.specifiers = []
        }
    })

    // import components from react-native-unistyles
    pairs.forEach(([localName, name]) => {
        const newImport = t.importDeclaration(
            [t.importSpecifier(t.identifier(localName), t.identifier(name))],
            t.stringLiteral(state.opts.isLocal
                ? state.file.opts.filename.split('react-native-unistyles').at(0).concat(`react-native-unistyles/components/native/${name}`)
                : `react-native-unistyles/components/native/${name}`
            )
        )

        path.node.body.unshift(newImport)
    })

    // cleanup
    nodesToRemove.forEach(node => path.node.body.splice(path.node.body.indexOf(node), 1))
}

const isInsideNodeModules = state => {
    return state.file.opts.filename.includes('node_modules') && !(state.opts.autoProcessImports ?? []).some(importName => {
        return state.file.opts.filename.includes(importName)
    })
}

module.exports = {
    isInsideNodeModules,
    addUnistylesImport
}
