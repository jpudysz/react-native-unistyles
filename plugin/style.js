function getStyleMetadata(t, node, dynamicFunction = null, state) {
    // {styles.container}
    if (t.isMemberExpression(node)) {
        const members = t.isMemberExpression(node.object)
            ? [node.object.object.name, node.object.property.name, node.property.name]
            : [node.object.name, node.property.name]

        return [
            {
                members: members.filter(Boolean),
                inlineStyle: undefined,
                dynamicFunction,
                conditionalExpression: undefined,
                logicalExpression: undefined
            }
        ]
    }

    // [styles.container]
    if (t.isArrayExpression(node)) {
        return node.elements.flatMap(element => getStyleMetadata(t, element, null, state))
    }

    // [...styles.container]
    if (t.isSpreadElement(node)) {
        return getStyleMetadata(t, node.argument, null, state)
    }

    // {{ ...styles.container }}
    if (t.isObjectExpression(node)) {
        return node
            .properties
            .flatMap(prop => {
                // handle inline styles
                if (t.isObjectProperty(prop)) {
                    return [{
                        members: [],
                        inlineStyle: t.objectExpression([prop]),
                        dynamicFunction: undefined,
                        conditionalExpression: undefined,
                        logicalExpression: undefined
                    }]
                }

                return getStyleMetadata(t, prop.argument, null, state)
            })
            .filter(Boolean)
    }

    // {styles.container(arg1, arg2)}
    if (t.isCallExpression(node)) {
        return getStyleMetadata(t, node.callee, node, state)
    }

    if (t.isIdentifier(node)) {
        return [{
            members: [node.name],
            inlineStyle: undefined,
            dynamicFunction: undefined,
            conditionalExpression: undefined,
            logicalExpression: undefined
        }]
    }

    if (t.isConditionalExpression(node)) {
        return [{
            members: [],
            inlineStyle: undefined,
            dynamicFunction: undefined,
            conditionalExpression: node,
            logicalExpression: undefined
        }]
    }

    if (t.isArrowFunctionExpression(node)) {
        return getStyleMetadata(t, node.body, node, state)
    }

    // {condition && styles.container}
    if (t.isLogicalExpression(node)) {
        return [{
            members: [],
            inlineStyle: undefined,
            dynamicFunction: undefined,
            conditionalExpression: undefined,
            logicalExpression: node
        }]
    }

    // only when pressable is used
    if (t.isBlockStatement(node) && state.file.shouldIncludePressable) {
        const returnStatement = node.body.find(t.isReturnStatement)

        return returnStatement
            ? getStyleMetadata(t, returnStatement.argument, null, state)
            : []
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
