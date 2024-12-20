function extractVariants(t, path, state) {
    const maybeVariants = path.node.body.find(node => (
        t.isExpressionStatement(node) &&
        t.isCallExpression(node.expression) &&
        t.isMemberExpression(node.expression.callee)
    ))

    if (!maybeVariants) {
        return
    }

    const calleeName = maybeVariants.expression.callee.object.name
    const isVariant = (
        t.isIdentifier(maybeVariants.expression.callee.object, { name: calleeName }) &&
        t.isIdentifier(maybeVariants.expression.callee.property, { name: 'useVariants' }) &&
        t.isObjectExpression(maybeVariants.expression.arguments[0])
    )

    if (!isVariant) {
        return
    }

    const node = maybeVariants.expression
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
        .findIndex(bodyPath => bodyPath === maybeVariants)
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
