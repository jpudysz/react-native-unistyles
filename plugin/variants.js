function extractVariants(t, path, state) {
    const maybeVariants = path.node.body.filter(node => (
        t.isExpressionStatement(node) &&
        t.isCallExpression(node.expression) &&
        t.isMemberExpression(node.expression.callee)
    ))

    if (maybeVariants.length === 0) {
        return
    }

    const targetVariant = maybeVariants.find(variant => {
        const calleeName = variant.expression.callee.object.name

        return (
            t.isIdentifier(variant.expression.callee.object, { name: calleeName }) &&
            t.isIdentifier(variant.expression.callee.property, { name: 'useVariants' }) &&
            t.isObjectExpression(variant.expression.arguments[0])
        )
    })

    if (!targetVariant) {
        return
    }

    const calleeName = targetVariant.expression.callee.object.name
    const node = targetVariant.expression
    const newUniqueName = path.scope.generateUidIdentifier(calleeName)

    // Create shadow declaration eg. const _styles = styles
    const shadowDeclaration = t.variableDeclaration('const', [
        t.variableDeclarator(newUniqueName, t.identifier(calleeName))
    ])

    // Create the new call expression eg. const styles = _styles.useVariants(...)
    const newCallExpression = t.callExpression(
        t.memberExpression(t.identifier(newUniqueName.name), t.identifier('useVariants')),
        node.arguments
    )
    const finalDeclaration = t.variableDeclaration('const', [
        t.variableDeclarator(t.identifier(calleeName), newCallExpression)
    ])

    // Find the current node's index, we will move everything after to new block
    const pathIndex = path.node.body
        .findIndex(bodyPath => bodyPath === targetVariant)
    const rest = path.node.body.slice(pathIndex + 1)

    // move rest to new block (scope)
    const blockStatement = t.blockStatement([
        finalDeclaration,
        ...rest
    ])

    path.node.body = [
        ...path.node.body.slice(0, pathIndex),
        shadowDeclaration,
        blockStatement
    ]

    state.file.hasVariants = true
}

module.exports = {
    extractVariants
}
