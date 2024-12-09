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

function wrapVariants(t, path) {
    const wrapperElement = t.jsxElement(
        t.jsxOpeningElement(
            t.jsxIdentifier('Variants'),
            [
                t.jsxAttribute(
                    t.jsxIdentifier('variants'),
                    t.jsxExpressionContainer(t.identifier('__uni__variants'))
                ),
            ],
            false
        ),
        t.jsxClosingElement(t.jsxIdentifier('Variants')),
        [path]
    )

    if (t.isJSXFragment(path)) {
        wrapperElement.children = path.children
    }

    // other case for React.Fragment
    const element = path.openingElement && path.openingElement.name

    if (t.isJSXMemberExpression(element) && element.object.name === 'React' && element.property.name === 'Fragment') {
        wrapperElement.children = path.children
        wrapperElement.openingElement.attributes.push(...path.openingElement.attributes)
    }

    return wrapperElement
}

function addJSXVariants(t, path) {
    if (!t.isReturnStatement(path.node)) {
        return
    }

    const jsxElement = path.node.argument

    if (t.isConditionalExpression(jsxElement)) {
        jsxElement.alternate = wrapVariants(t, jsxElement.alternate)
        jsxElement.consequent = wrapVariants(t, jsxElement.consequent)

        return
    }

    if (!t.isJSXElement(jsxElement) && !t.isJSXFragment(jsxElement)) {
        return
    }

    path.get('argument').replaceWith(wrapVariants(t, jsxElement));
}

module.exports = {
    isUsingVariants,
    extractVariants,
    addJSXVariants
}
