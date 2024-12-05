module.exports = function addUnistylesImport(t, path, state) {
    const newImport = t.importDeclaration(
        [
            t.importSpecifier(t.identifier('UnistylesShadowRegistry'), t.identifier('UnistylesShadowRegistry')),
            ...state.file.shouldIncludePressable
                ? [
                    t.importSpecifier(t.identifier('Pressable'), t.identifier('Pressable'))
                ]
                : []
        ].filter(Boolean),
        t.stringLiteral('react-native-unistyles')
    )

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

    path.node.body.unshift(newImport)
}
