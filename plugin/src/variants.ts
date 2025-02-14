import type { NodePath } from '@babel/core'
import * as t from '@babel/types'
import type { UnistylesPluginPass } from './types'

export function extractVariants(path: NodePath<t.BlockStatement>, state: UnistylesPluginPass) {
    const maybeVariants = path.node.body.filter(node => (
        t.isExpressionStatement(node) &&
        t.isCallExpression(node.expression) &&
        t.isMemberExpression(node.expression.callee)
    ))

    if (maybeVariants.length === 0) {
        return
    }

    const targetVariant = maybeVariants.find((variant): variant is t.ExpressionStatement => {
        if (!t.isExpressionStatement(variant) || !t.isCallExpression(variant.expression) || !t.isMemberExpression(variant.expression.callee) || !t.isIdentifier(variant.expression.callee.object)) {
            return false
        }

        const calleeName = variant.expression.callee.object.name

        return (
            t.isIdentifier(variant.expression.callee.object, { name: calleeName }) &&
            t.isIdentifier(variant.expression.callee.property, { name: 'useVariants' }) &&
            variant.expression.arguments.length === 1
        )
    })

    if (!targetVariant) {
        return
    }

    const node = targetVariant.expression
    if (!t.isCallExpression(node)) {
        return
    }

    const callee = node.callee
    if (!t.isMemberExpression(callee) || !t.isIdentifier(callee.object)) {
        return
    }

    const calleeName = callee.object.name
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
    const statement = t.blockStatement([
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
