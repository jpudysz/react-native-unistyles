function getRefProp(t, path) {
    return path.node.openingElement.attributes.find(attr =>
        t.isJSXAttribute(attr) &&
        t.isJSXIdentifier(attr.name, { name: 'ref' }) &&
        t.isJSXExpressionContainer(attr.value)
    )
}

function hasStringRef(t, path) {
    return path.node.openingElement.attributes.find(attr =>
        t.isJSXAttribute(attr) &&
        t.isJSXIdentifier(attr.name, { name: 'ref' }) &&
        t.isStringLiteral(attr.value)
    )
}

function memberExpressionFromArray(t, identifiers) {
    // possible for inline styles
    if (identifiers.length === 0) {
        return undefined
    }

    const [base, ...members] = identifiers

    return members.reduce((object, property) => t.memberExpression(object, t.identifier(property)), t.identifier(base))
}

function addRef(t, path, metadata, state) {
    const hasVariants = state.file.hasVariants

    const newRefFunction = t.arrowFunctionExpression(
        [t.identifier('ref')],
        t.blockStatement([
            t.expressionStatement(
                t.callExpression(
                    t.memberExpression(t.identifier('UnistylesShadowRegistry'), t.identifier('add')),
                    [
                        t.identifier('ref'),
                        memberExpressionFromArray(t, metadata.members) || metadata.inlineStyle || metadata.conditionalExpression,
                        t.identifier(hasVariants ? '__uni__variants' : 'undefined'),
                        metadata.dynamicFunction ? t.arrayExpression(metadata.dynamicFunction.arguments) : t.identifier('undefined')
                    ]
                )
            ),
            t.returnStatement(
                t.arrowFunctionExpression([],
                    t.callExpression(
                        t.memberExpression(t.identifier('UnistylesShadowRegistry'), t.identifier('remove')),
                        [t.identifier('ref')]
                    )
                )
            )
        ])
    )

    const newRefProp = t.jsxAttribute(
        t.jsxIdentifier('ref'),
        t.jsxExpressionContainer(newRefFunction)
    )

    path.node.openingElement.attributes.push(newRefProp)
}

function overrideRef(t, path, refProp, metadata, state) {
    const hasVariants = state.file.hasVariants
    const uniqueRefName = path.scope.generateUidIdentifier('ref').name
    const isIdentifier = t.isIdentifier(refProp.value.expression)
    const binding = path.scope.getBinding(refProp.value.expression.name)

    // ref={ref}
    if (isIdentifier && binding && t.isCallExpression(binding.path.node.init)) {
        const userVariableName = refProp.value.expression.name
        const newRefFunction = t.arrowFunctionExpression(
            [t.identifier(uniqueRefName)],
            t.blockStatement([
                t.expressionStatement(
                    t.assignmentExpression(
                        '=',
                        t.memberExpression(t.identifier(userVariableName), t.identifier('current')),
                        t.identifier(uniqueRefName)
                    )
                ),
                t.expressionStatement(
                    t.callExpression(
                        t.memberExpression(t.identifier('UnistylesShadowRegistry'), t.identifier('add')),
                        [
                            t.identifier(uniqueRefName),
                            memberExpressionFromArray(t, metadata.members) || metadata.inlineStyle || metadata.conditionalExpression,
                            t.identifier(hasVariants ? '__uni__variants' : 'undefined'),
                            metadata.dynamicFunction ? t.arrayExpression(metadata.dynamicFunction.arguments) : t.identifier('undefined')
                        ]
                    )
                ),
                t.returnStatement(
                    t.arrowFunctionExpression([],
                        t.callExpression(
                            t.memberExpression(t.identifier('UnistylesShadowRegistry'), t.identifier('remove')),
                            [
                                t.identifier(uniqueRefName)
                            ]
                        )
                    )
                )
            ])
        )

        refProp.value = t.jsxExpressionContainer(newRefFunction)

        return
    }

    // ref={ref => { }}
    if (t.isArrowFunctionExpression(refProp.value.expression)) {
        const userArrowFunction = refProp.value.expression
        const userStatements = userArrowFunction.body.body
        const userReturnStatement = userStatements.find(statement => t.isReturnStatement(statement))
        const userCleanupFunction = userReturnStatement
            ? userReturnStatement.argument
            : null
        const userRefName = refProp.value.expression.params.length >= 1
            ? refProp.value.expression.params.at(0).name
            : 'ref'

        const newRefFunction = t.arrowFunctionExpression(
            [t.identifier(userRefName)],
            t.blockStatement([
                ...userStatements.filter(statement => !t.isReturnStatement(statement)),
                t.expressionStatement(
                    t.callExpression(
                        t.memberExpression(t.identifier('UnistylesShadowRegistry'), t.identifier('add')),
                        [
                            t.identifier(userRefName),
                            memberExpressionFromArray(t, metadata.members) || metadata.inlineStyle || metadata.conditionalExpression,
                            t.identifier(hasVariants ? '__uni__variants' : 'undefined'),
                            metadata.dynamicFunction ? t.arrayExpression(metadata.dynamicFunction.arguments) : t.identifier('undefined')
                        ]
                    )
                ),
                // Merged cleanup function
                t.returnStatement(
                    t.arrowFunctionExpression([], t.blockStatement([
                        ...(userCleanupFunction ? [
                            t.expressionStatement(
                                t.callExpression(userCleanupFunction, [])
                            )
                        ] : []),
                        t.expressionStatement(
                            t.callExpression(
                                t.memberExpression(t.identifier('UnistylesShadowRegistry'), t.identifier('remove')),
                                [
                                    t.identifier(userRefName)
                                ]
                            )
                        )
                    ]))
                )
            ])
        )

        refProp.value = t.jsxExpressionContainer(newRefFunction)

        return
    }

    if (!binding) {
        return
    }

    // ref={scopedFunction}
    const isArrowFunction = t.isArrowFunctionExpression(binding.path.node.init)
    const isFunction = t.isFunctionDeclaration(binding.path.node)

    if (!isArrowFunction && !isFunction) {
        return
    }

    const userFunctionName = refProp.value.expression
    const userFunction = isArrowFunction
        ? binding.path.node.init
        : binding.path.node
    const returnStatement = userFunction.body.body.find(statement => t.isReturnStatement(statement));
    const userCleanupFunction = returnStatement ? returnStatement.argument : null;

    const newRefFunction = t.arrowFunctionExpression(
        [t.identifier(uniqueRefName)],
        t.blockStatement([
            t.expressionStatement(
                t.callExpression(userFunctionName, [t.identifier(uniqueRefName)])
            ),
            t.expressionStatement(
                t.callExpression(
                    t.memberExpression(t.identifier('UnistylesShadowRegistry'), t.identifier('add')),
                    [
                        t.identifier(uniqueRefName),
                        memberExpressionFromArray(t, metadata.members) || metadata.inlineStyle || metadata.conditionalExpression,
                        t.identifier(hasVariants ? '__uni__variants' : 'undefined'),
                        metadata.dynamicFunction ? t.arrayExpression(metadata.dynamicFunction.arguments) : t.identifier('undefined')
                    ]
                )
            ),
            t.returnStatement(
                t.arrowFunctionExpression([], t.blockStatement([
                    ...(userCleanupFunction ? [
                        t.expressionStatement(
                            t.callExpression(userCleanupFunction, [])
                        )
                    ] : []),
                    t.expressionStatement(
                        t.callExpression(
                            t.memberExpression(t.identifier('UnistylesShadowRegistry'), t.identifier('remove')),
                            [
                                t.identifier(uniqueRefName)
                            ]
                        )
                    )
                ].filter(Boolean)))
            )
        ])
    )

    refProp.value = t.jsxExpressionContainer(newRefFunction)
    userFunction.body.body = userFunction.body.body.filter(statement => !t.isReturnStatement(statement))
}

module.exports = {
    getRefProp,
    addRef,
    overrideRef,
    hasStringRef
}
