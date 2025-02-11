import { blockStatement, callExpression, identifier, isCallExpression, isExpressionStatement, isIdentifier, isMemberExpression, memberExpression, variableDeclaration, variableDeclarator, type BlockStatement, type ExpressionStatement } from "@babel/types"
import type { UnistylesPluginPass } from "./types"
import type { NodePath } from "@babel/core"

export function extractVariants(path: NodePath<BlockStatement>, state: UnistylesPluginPass) {
    const maybeVariants = path.node.body.filter(node => (
        isExpressionStatement(node) &&
        isCallExpression(node.expression) &&
        isMemberExpression(node.expression.callee)
    ))

    if (maybeVariants.length === 0) {
        return
    }

    const targetVariant = maybeVariants.find((variant): variant is ExpressionStatement => {
        if (!isExpressionStatement(variant) || !isCallExpression(variant.expression) || !isMemberExpression(variant.expression.callee) || !isIdentifier(variant.expression.callee.object)) {
            return false
        }

        const calleeName = variant.expression.callee.object.name

        return (
            isIdentifier(variant.expression.callee.object, { name: calleeName }) &&
            isIdentifier(variant.expression.callee.property, { name: 'useVariants' }) &&
            variant.expression.arguments.length === 1
        )
    })

    if (!targetVariant) {
        return
    }

    const node = targetVariant.expression;
    if (!isCallExpression(node)) {
        return;
    }

    const callee = node.callee;
    if (!isMemberExpression(callee) || !isIdentifier(callee.object)) {
        return;
    }

    const calleeName = callee.object.name;
    const newUniqueName = path.scope.generateUidIdentifier(calleeName)

    // Create shadow declaration eg. const _styles = styles
    const shadowDeclaration = variableDeclaration('const', [
        variableDeclarator(newUniqueName, identifier(calleeName))
    ])

    // Create the new call expression eg. const styles = _styles.useVariants(...)
    const newCallExpression = callExpression(
        memberExpression(identifier(newUniqueName.name), identifier('useVariants')),
        node.arguments
    )
    const finalDeclaration = variableDeclaration('const', [
        variableDeclarator(identifier(calleeName), newCallExpression)
    ])

    // Find the current node's index, we will move everything after to new block
    const pathIndex = path.node.body
        .findIndex(bodyPath => bodyPath === targetVariant)
    const rest = path.node.body.slice(pathIndex + 1)

    // move rest to new block (scope)
    const statement = blockStatement([
        finalDeclaration,
        ...rest
    ])

    path.node.body = [
        ...path.node.body.slice(0, pathIndex),
        shadowDeclaration,
        statement
    ]

    state.file.hasVariants = true
}
