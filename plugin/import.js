module.exports = function addShadowRegistryImport(t, path) {
    const newImport = t.importDeclaration(
        [t.importSpecifier(t.identifier('UnistylesShadowRegistry'), t.identifier('UnistylesShadowRegistry'))],
        t.stringLiteral('react-native-unistyles')
    )

    path.unshiftContainer('body', newImport)
}
