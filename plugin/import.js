module.exports = function addUnistylesImport(t, path, state) {
    const thingsToImport =  [
        ...state.file.shouldIncludePressable
            ? [
                t.importSpecifier(t.identifier('Pressable'), t.identifier('Pressable'))
            ]
            : []
    ].filter(Boolean)

    if (state.file.shouldIncludePressable) {
        path.node.body.forEach(node => {
            // user might have multiple imports like import type, import
            if (t.isImportDeclaration(node) && node.source.value === 'react-native') {
                node.specifiers = node.specifiers.filter(specifier => specifier.local.name !== 'Pressable')

                if (node.specifiers.length === 0) {
                    path.node.body.splice(path.node.body.indexOf(node), 1)
                }
            }
        })

        const rnWebImport = path.node.body.find(node => t.isImportDeclaration(node) && node.source.value === 'react-native-web/dist/exports/Pressable')
        const unistylesImport = path.node.body.find(node => t.isImportDeclaration(node) && node.source.value === 'react-native-unistyles')
        const hasUniPressable = unistylesImport && unistylesImport.specifiers
            ? unistylesImport.specifiers.find(specifier => specifier.imported.name === 'Pressable' && specifier.local.name !== "NativePressableReactNative")
            : false

        if (rnWebImport && !hasUniPressable) {
            rnWebImport.specifiers = []
        }
    }

    if (thingsToImport.length === 0) {
        return
    }

    const newImport = t.importDeclaration(
        thingsToImport,
        t.stringLiteral('react-native-unistyles')
    )

    path.node.body.unshift(newImport)
}
