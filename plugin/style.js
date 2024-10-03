function getStyleObjectPath(t, node) {
    // {styles.container}
    if (t.isMemberExpression(node)) {
        return [node.object.name, node.property.name]
    }

    // [styles.container]
    if (t.isArrayExpression(node)) {
        return node.elements.flatMap(element => getStyleObjectPath(t, element))
    }

    // [...styles.container]
    if (t.isSpreadElement(node)) {
        return getStyleObjectPath(t, node.argument)
    }

    // {{ ...styles.container }}
    if (t.isObjectExpression(node)) {
        return node.properties.flatMap(prop => getStyleObjectPath(t, prop.argument))
    }

    // {styles.container(arg1, arg2)}
    if (t.isCallExpression(node)) {
        return getStyleObjectPath(t, node.callee)
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
