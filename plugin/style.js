function getStyleMetadata(t, node, dynamicFunction = null) {
    // {styles.container}
    if (t.isMemberExpression(node)) {
        const members = t.isMemberExpression(node.object)
            ? [node.object.object.name, node.object.property.name, node.property.name]
            : [node.object.name, node.property.name]

        return [
            {
                members: members.filter(Boolean),
                dynamicFunction
            }
        ]
    }

    // [styles.container]
    if (t.isArrayExpression(node)) {
        return node.elements.flatMap(element => getStyleMetadata(t, element))
    }

    // [...styles.container]
    if (t.isSpreadElement(node)) {
        return getStyleMetadata(t, node.argument)
    }

    // {{ ...styles.container }}
    if (t.isObjectExpression(node)) {
        return node.properties.flatMap(prop => getStyleMetadata(t, prop.argument))
    }

    // {styles.container(arg1, arg2)}
    if (t.isCallExpression(node)) {
        return getStyleMetadata(t, node.callee, node)
    }

    // {styles}
    if (t.isIdentifier(node)) {
        return [{
            members: [node.name],
            dynamicFunction: undefined
        }]
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

function styleAttributeToArray(t, path) {
    const styleAttribute = getStyleAttribute(t, path)

    // {{...style.container, ...style.container}}
    if (t.isObjectExpression(styleAttribute.value.expression)) {
        const properties = styleAttribute.value.expression.properties
            .map(property => t.isSpreadElement(property)
                ? property.argument
                : t.objectExpression([property])
            )

        styleAttribute.value.expression = t.arrayExpression(properties)

        return
    }

    // [{...style.container, ...style.container}]
    if (t.isArrayExpression(styleAttribute.value.expression)) {
        const properties = styleAttribute.value.expression.elements
            .flatMap(property => {
                if (t.isSpreadElement(property)) {
                    return property.argument
                }
                return property
            })

        styleAttribute.value.expression = t.arrayExpression(properties)

        return
    }

    styleAttribute.value.expression = t.arrayExpression([styleAttribute.value.expression])
}

module.exports = {
    getStyleMetadata,
    getStyleAttribute,
    styleAttributeToArray
}
