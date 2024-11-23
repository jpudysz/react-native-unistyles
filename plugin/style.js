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
                conditionalExpression: undefined,
                logicalExpression: undefined
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
                        conditionalExpression: undefined,
                        logicalExpression: undefined
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
        return getStyleMetadata(t, node.body, node)
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

function metadataToRawStyle(t, metadata) {
    const expressions = []

    metadata.forEach(meta => {
        if (meta.inlineStyle) {
            return meta.inlineStyle.properties.forEach(prop => {
                if (t.isObjectProperty(prop)) {
                    expressions.push(t.objectExpression([prop]))
                }
            })
        }

        if (meta.members.length > 0) {
            return expressions.push(t.memberExpression(...meta.members.map(member => t.identifier(member))))
        }

        if (meta.logicalExpression) {
            return expressions.push(meta.logicalExpression)
        }
    })

    return t.jsxAttribute(
        t.jsxIdentifier('rawStyle'),
        t.jsxExpressionContainer(t.arrayExpression([
            ...expressions
        ]))
    )
}

function handlePressable(t, path, styleAttr, metadata, state) {
    if (state.file.hasVariants) {
        const variants = t.jsxAttribute(
            t.jsxIdentifier('variants'),
            t.jsxExpressionContainer(t.identifier('__uni__variants'))
        )

        path.node.openingElement.attributes.push(variants)
    }

    // add raw C++ style as prop to be bound
    path.node.openingElement.attributes.push(metadataToRawStyle(t, metadata))

    const styleExpression = styleAttr.value.expression
    // {style.pressable}
    if (t.isMemberExpression(styleExpression)) {
        // user may care about state, but didn't pass any arguments
        const members = metadata.at(0).members

        if (members.length === 0) {
            return
        }

        const stylePath = members.slice(1).reduce(
            (acc, property) => t.memberExpression(acc, t.identifier(property)),
            t.identifier(members[0])
        )
        const expression = t.callExpression(
            t.identifier('getBoundArgs'),
            [stylePath]
        )
        const bindCall = t.callExpression(
            t.memberExpression(expression, t.identifier('bind')),
            [t.identifier('undefined'), t.identifier("state")]
        )

        // state => typeof style.pressable === 'function'
        // ? getBoundArgs(style.pressable).bind(undefined, state)
        // : style.pressable
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
                bindCall,
                stylePath
            )
        )

        return
    }

    // {style.pressable(1, 2)}
    if (t.isCallExpression(styleExpression)) {
        // user already called dynamic function
        const expression = t.callExpression(
            t.identifier('getBoundArgs'),
            [styleExpression.callee]
        )
        const bindCall = t.callExpression(
            t.memberExpression(expression, t.identifier('bind')),
            [t.identifier('undefined'), ...styleExpression.arguments]
        )

        path.node.openingElement.attributes = path.node.openingElement.attributes.map(attribute => {
            if (attribute.name.name === "style") {
                attribute.value.expression = t.arrowFunctionExpression([], bindCall)
            }

            return attribute
        })

        return
    }

    // {() => style.pressable(1, 2)}
    if (t.isArrowFunctionExpression(styleExpression) && styleExpression.params.length === 0) {
        const wrapper = t.isBlockStatement(styleExpression.body)
            ? styleExpression.body.body.find(node => t.isReturnStatement(node))
            : styleExpression.body

        if (t.isMemberExpression(wrapper)) {
            return
        }

        const pressableArgs = t.isCallExpression(wrapper)
            ? wrapper.arguments
            : wrapper.argument.arguments
        const callee = t.isCallExpression(wrapper)
            ? wrapper.callee
            : wrapper.argument.callee
        const getBoundArgsCall = t.callExpression(
            t.identifier('getBoundArgs'),
            [callee]
        )
        const bindCall = t.callExpression(
            t.memberExpression(getBoundArgsCall, t.identifier('bind')),
            [t.identifier('undefined'), ...pressableArgs]
        )

        if (t.isCallExpression(wrapper)) {
            styleExpression.body = bindCall

            return
        }

        if (wrapper) {
            wrapper.argument = bindCall
        }

        return
    }

    // {state => style.pressable(state, 1, 2)}
    if (t.isArrowFunctionExpression(styleExpression) && styleExpression.params.length > 0) {
        // user used state with custom args we need to getBoundArgs
        // detect between arrow function with body and arrow function
        const wrapper = t.isBlockStatement(styleExpression.body)
            ? styleExpression.body.body.find(node => t.isReturnStatement(node))
            : styleExpression.body

        function handlePressableArgs(wrapper) {
            if (t.isMemberExpression(wrapper) || t.isObjectExpression(wrapper) || t.isLogicalExpression(wrapper)) {
                return
            }

            const pressableArgs = t.isCallExpression(wrapper)
                ? wrapper.arguments
                : wrapper.argument.arguments
            const callee = t.isCallExpression(wrapper)
                ? wrapper.callee
                : wrapper.argument.callee

            const getBoundArgsCall = t.callExpression(
                t.identifier('getBoundArgs'),
                [callee]
            )
            const bindCall = t.callExpression(
                t.memberExpression(getBoundArgsCall, t.identifier('bind')),
                [t.identifier('undefined'), ...pressableArgs]
            )

            if (t.isCallExpression(wrapper)) {
                styleExpression.body = bindCall

                return
            }

            if (wrapper) {
                wrapper.argument = bindCall
            }
        }

        if (t.isArrayExpression(wrapper)) {
            return wrapper.elements.forEach(handlePressableArgs)
        }

        handlePressableArgs(wrapper)
    }
}

module.exports = {
    getStyleMetadata,
    getStyleAttribute,
    styleAttributeToArray,
    handlePressable
}
