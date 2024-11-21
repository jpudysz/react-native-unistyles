module.exports = function addUnistylesImport(t, path, state) {
    const newImport = t.importDeclaration(
        [
            t.importSpecifier(t.identifier('UnistylesShadowRegistry'), t.identifier('UnistylesShadowRegistry')),
            state.file.shouldIncludePressable
                ? t.importSpecifier(t.identifier('Pressable'), t.identifier('Pressable'))
                : undefined
        ].filter(Boolean),
        t.stringLiteral('react-native-unistyles')
    )

    path.node.body.unshift(newImport)
}
