import type { NodePath } from '@babel/core'

import * as t from '@babel/types'

import type { UnistylesPluginPass } from './types'

const scopedVariants = new WeakMap<t.VariableDeclarator, string>()

export function extractVariants(path: NodePath<t.BlockStatement>, state: UnistylesPluginPass) {
    const maybeVariants = path.node.body.filter(
        (node) =>
            t.isExpressionStatement(node) &&
            t.isCallExpression(node.expression) &&
            t.isMemberExpression(node.expression.callee),
    )

    if (maybeVariants.length === 0) {
        return
    }

    const targetVariant = maybeVariants.find((variant): variant is t.ExpressionStatement => {
        if (
            !t.isExpressionStatement(variant) ||
            !t.isCallExpression(variant.expression) ||
            !t.isMemberExpression(variant.expression.callee) ||
            !t.isIdentifier(variant.expression.callee.object)
        ) {
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
    const binding = path.scope.getBinding(calleeName)
    // useVariants was already called in this scope, so calleeName points to the result of the previous call
    // call it on the original stylesheet instead, React Compiler doesn't allow calling hooks from hook results
    const existingShadowName =
        binding && t.isVariableDeclarator(binding.path.node) ? scopedVariants.get(binding.path.node) : undefined
    const shadowName = existingShadowName ?? path.scope.generateUidIdentifier(calleeName).name

    // Create the new call expression eg. const styles = _styles.useVariants(...)
    const newCallExpression = t.callExpression(
        t.memberExpression(t.identifier(shadowName), t.identifier('useVariants')),
        node.arguments,
    )
    const finalDeclarator = t.variableDeclarator(t.identifier(calleeName), newCallExpression)
    const finalDeclaration = t.variableDeclaration('const', [finalDeclarator])

    scopedVariants.set(finalDeclarator, shadowName)

    // Find the current node's index, we will move everything after to new block
    const pathIndex = path.node.body.findIndex((bodyPath) => bodyPath === targetVariant)
    const rest = path.node.body.slice(pathIndex + 1)

    // move rest to new block (scope)
    const statement = t.blockStatement([finalDeclaration, ...rest])

    state.file.hasVariants = true

    if (existingShadowName) {
        path.node.body = [...path.node.body.slice(0, pathIndex), statement]

        return
    }

    // Create shadow declaration eg. const _styles = styles
    const shadowDeclaration = t.variableDeclaration('const', [
        t.variableDeclarator(t.identifier(shadowName), t.identifier(calleeName)),
    ])

    path.node.body = [...path.node.body.slice(0, pathIndex), shadowDeclaration, statement]

    // body was swapped on the node, so babel's scope doesn't know about the shadow declaration
    // plugins running later in the same pass (eg. React Compiler) resolve bindings and would throw
    path.scope.registerDeclaration(path.get(`body.${pathIndex}`) as NodePath<t.VariableDeclaration>)
}
