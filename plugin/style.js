const { PRESSABLE_STATE_NAME } = require('./common')

function getStyleMetadata(t, node, dynamicFunction = null) {
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
                conditionalExpression: undefined
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
        return node
            .properties
            .flatMap(prop => {
                // handle inline styles
                if (t.isObjectProperty(prop)) {
                    return [{
                        members: [],
                        inlineStyle: t.objectExpression([prop]),
                        dynamicFunction: undefined,
                        conditionalExpression: undefined
                    }]
                }

                return getStyleMetadata(t, prop.argument)
            })
            .filter(Boolean)
    }

    // {styles.container(arg1, arg2)}
    if (t.isCallExpression(node)) {
        return getStyleMetadata(t, node.callee, node)
    }

    if (t.isIdentifier(node)) {
        return [{
            members: [node.name],
            inlineStyle: undefined,
            dynamicFunction: undefined,
            conditionalExpression: undefined
        }]
    }

    if (t.isConditionalExpression(node)) {
        return [{
            members: [],
            inlineStyle: undefined,
            dynamicFunction: undefined,
            conditionalExpression: node
        }]
    }

    // pressable
    if (t.isArrowFunctionExpression(node)) {
        return getStyleMetadata(t, node.body, node)
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

    // special case for pressable
    // {state => styles.pressable(state)}
    if (t.isArrowFunctionExpression(styleAttribute.value.expression)) {
        return
    }

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

function handlePressable(t, path, styleAttr, metadata) {
    const styleExpression = styleAttr.value.expression

    // {style.pressable}
    // the worst case, we don't know if user rely on state
    if (t.isMemberExpression(styleExpression)) {
        const members = metadata.at(0).members

        if (members.length === 0) {
            return
        }

        const stylePath = members.slice(1).reduce(
            (acc, property) => t.memberExpression(acc, t.identifier(property)),
            t.identifier(members[0])
        )

        // state => typeof style.pressable === 'function' ? style.pressable(state) : style.pressable
        styleAttr.value.expression = t.arrowFunctionExpression(
            [t.identifier("state")],
            t.conditionalExpression(
                t.binaryExpression(
                    "===",
                    t.unaryExpression(
                        "typeof",
                        stylePath
                    ),
                    t.stringLiteral("function")
                ),
                t.callExpression(
                    stylePath,
                    [t.identifier("state")]
                ),
                stylePath
            )
        )

        return
    }

    // {style.pressable(1, 2)}
    if (t.isCallExpression(styleExpression)) {
        // user already called dynamic function
        // there is no work to do
        return
    }

    // {() => style.pressable(1, 2)}
    if (t.isArrowFunctionExpression(styleExpression) && styleExpression.params.length === 0) {
        // user doesn't care about the state
        // we can safely unwrap the function
        styleAttr.value.expression = styleExpression.body

        return
    }

    // {state => style.pressable(state, 1, 2)}
    if (t.isArrowFunctionExpression(styleExpression) && styleExpression.params.length > 0) {
        // already a function, we need to set state to false
        // and pass it to C++ as in background it will never be true
        const args = metadata.at(0).dynamicFunction

        if (!t.isCallExpression(args) || args.arguments.length === 0) {
            return
        }

        // get state local name
        const stateIdentifier = styleExpression.params[0]

        if (!stateIdentifier || !t.isIdentifier(stateIdentifier)) {
            return
        }

        // replace state name with matching identifier
        args.arguments.map(arg => {
            if (t.isIdentifier(arg) && arg.name === stateIdentifier.name) {
                arg.name = PRESSABLE_STATE_NAME
            }

            if (t.isMemberExpression(arg) && arg.object.name === stateIdentifier.name) {
                arg.object.name = PRESSABLE_STATE_NAME
            }

            return arg
        })

        // update arrow function arg name
        styleExpression.params[0].name = PRESSABLE_STATE_NAME
    }
}

module.exports = {
    getStyleMetadata,
    getStyleAttribute,
    styleAttributeToArray,
    handlePressable
}
