module.exports = function addUnistylesImport(t, path, state) {
    const newImport = t.importDeclaration(
        [
            t.importSpecifier(t.identifier('UnistylesShadowRegistry'), t.identifier('UnistylesShadowRegistry')),
            ...state.file.shouldIncludePressable
                ? [
                    t.importSpecifier(t.identifier('Pressable'), t.identifier('Pressable')),
                    t.importSpecifier(t.identifier('getBoundArgs'), t.identifier('getBoundArgs'))
                ]
                : []
        ].filter(Boolean),
        t.stringLiteral('react-native-unistyles')
    )

    if (state.file.shouldIncludePressable) {
        const rnImport = path.node.body.find(node => t.isImportDeclaration(node) && node.source.value === 'react-native')

        if (rnImport) {
            rnImport.specifiers = rnImport.specifiers.filter(specifier => specifier.local.name !== 'Pressable')
        }

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
