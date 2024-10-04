function getStyleObjectPath(t, node, state) {
    // {styles.container}
    if (t.isMemberExpression(node)) {
        return [node.object.name, node.property.name]
    }

    // [styles.container]
    if (t.isArrayExpression(node)) {
        return node.elements.flatMap(element => getStyleObjectPath(t, element, state))
    }

    // [...styles.container]
    if (t.isSpreadElement(node)) {
        return getStyleObjectPath(t, node.argument, state)
    }

    // {{ ...styles.container }}
    if (t.isObjectExpression(node)) {
        return node.properties.flatMap(prop => getStyleObjectPath(t, prop.argument, state))
    }

    // {styles.container(arg1, arg2)}
    if (t.isCallExpression(node)) {
        const path = getStyleObjectPath(t, node.callee, state)
        const lastPart = path.slice(-1)

        if (!lastPart) {
            return path
        }

        // for web increment counter for dynamic functions
        if (state.file.webDynamicFunctions[lastPart]) {
            node.arguments.push(t.numericLiteral(++state.file.webDynamicFunctions[lastPart]))

            return path
        }

        state.file.webDynamicFunctions[lastPart] = 1
        node.arguments.push(t.numericLiteral(1))

        return path
    }

    return []
}

function getStyleAttribute(t, path) {
    return path.node.openingElement.attributes.find(attr =>
        t.isJSXAttribute(attr) &&
        t.isJSXIdentifier(attr.name, { name: 'style' }) &&
        t.isJSXExpressionContainer(attr.value)
    )
}

module.exports = {
    getStyleObjectPath,
    getStyleAttribute
}
