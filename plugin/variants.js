function isUsingVariants(t, path) {
    const callee = path.get('callee')

    return (
        t.isMemberExpression(callee) &&
        t.isIdentifier(callee.node.object, { name: 'styles' }) &&
        t.isIdentifier(callee.node.property, { name: 'useVariants' }) &&
        t.isObjectExpression(path.node.arguments[0])
    )
}

function extractVariants(t, path, state) {
    const arg = path.node.arguments[0]

    const variantDeclaration = t.variableDeclaration('const', [
        t.variableDeclarator(
            t.identifier('__uni__variants'),
            arg
        )
    ])

    // Replace useVariants argument with __uni__variants
    path.node.arguments[0] = t.identifier('__uni__variants')

    path.insertBefore(variantDeclaration)

    state.file.hasVariants = true
}

module.exports = {
    isUsingVariants,
    extractVariants
}
