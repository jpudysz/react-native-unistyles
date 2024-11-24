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

    // pressable
    if (t.isBlockStatement(node)) {
        const returnStatement = node.body.find(t.isReturnStatement)

        return returnStatement
            ? getStyleMetadata(t, returnStatement.argument, null)
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
            if (t.isIdentifier(meta.logicalExpression.left)) {
                if (t.isMemberExpression(meta.logicalExpression.right)) {
                    return expressions.push(meta.logicalExpression.right)
                }

                expressions.push(meta.logicalExpression.right.callee)
            }
        }

        if (meta.conditionalExpression) {
            let hasLeft = false
            let hasRight = false

            if (t.isCallExpression(meta.conditionalExpression.consequent)) {
                expressions.push(meta.conditionalExpression.consequent.callee)
                hasLeft = true
            }

            if (t.isMemberExpression(meta.conditionalExpression.consequent)) {
                expressions.push(meta.conditionalExpression.consequent)
                hasLeft = true
            }

            if (!hasLeft) {
                expressions.push(meta.conditionalExpression.consequent)
            }

            if (t.isCallExpression(meta.conditionalExpression.alternate)) {
                expressions.push(meta.conditionalExpression.alternate.callee)
                hasRight = true
            }

            if (t.isMemberExpression(meta.conditionalExpression.alternate)) {
                expressions.push(meta.conditionalExpression.alternate)
                hasRight = true
            }

            if (!hasRight) {
                expressions.push(meta.conditionalExpression.alternate)
            }
        }
    })

    return t.jsxAttribute(
        t.jsxIdentifier('rawStyle'),
        t.jsxExpressionContainer(t.arrayExpression([
            ...expressions
        ]))
    )
}

function wrapInGetBoundArgs(t, toWrap, extraArgs) {
    const expression = t.callExpression(
        t.identifier('getBoundArgs'),
        [toWrap]
    )

    return  t.callExpression(
        t.memberExpression(expression, t.identifier('bind')),
        [t.identifier('undefined'), ...extraArgs].filter(Boolean)
    )
}

function handlePressableFromMemberExpression(t, path, metadata, wrapInArrowFunction) {
    let expression = undefined
    let args = []

    const members = metadata.at(0).members

    if (members) {
        expression = members.slice(1).reduce(
            (acc, property) => t.memberExpression(acc, t.identifier(property)),
            t.identifier(members[0]))
    }

    if (t.isMemberExpression(metadata.at(0))) {
        expression = metadata.at(0)
    }

    if (t.isCallExpression(metadata.at(0))) {
        expression = metadata.at(0).callee
        args = metadata.at(0).arguments
    }

    if (!expression) {
        return
    }

    const bindCall = wrapInGetBoundArgs(t , expression, wrapInArrowFunction ? [t.identifier("state")] : args)

    if (t.isCallExpression(metadata.at(0))) {
        return bindCall
    }

    if (!wrapInArrowFunction) {
        return t.conditionalExpression(
            t.binaryExpression(
                "===",
                t.unaryExpression(
                    "typeof",
                    expression
                ),
                t.stringLiteral("function")
            ),
            bindCall,
            expression
        )
    }

    // state => typeof style.pressable === 'function'
    // ? getBoundArgs(style.pressable).bind(undefined, state)
    // : style.pressable
    return t.arrowFunctionExpression(
        [t.identifier("state")],
        t.conditionalExpression(
            t.binaryExpression(
                "===",
                t.unaryExpression(
                    "typeof",
                    expression
                ),
                t.stringLiteral("function")
            ),
            bindCall,
            expression
        )
    )
}

function handlePressableArgs(t, path, styleExpression, metadata, parentWrapper, wrapper, index) {
    if (t.isObjectExpression(wrapper)) {
        return
    }

    if (t.isMemberExpression(wrapper) && t.isArrayExpression(parentWrapper)) {
        parentWrapper.elements[index] = handlePressableFromMemberExpression(t, path, [metadata[index]])

        return
    }

    if (t.isMemberExpression(wrapper) && !t.isArrayExpression(parentWrapper)) {
        parentWrapper = handlePressableFromMemberExpression(t, path, metadata)

        return
    }

    if (t.isLogicalExpression(wrapper)) {
        if (t.isIdentifier(wrapper.left) && t.isMemberExpression(wrapper.right)) {
            parentWrapper.elements[index].right = handlePressableFromMemberExpression(t, path, [parentWrapper.elements[index].right])

            return
        }

        return
    }

    if (t.isConditionalExpression(wrapper) && t.isArrayExpression(parentWrapper)) {
        if (t.isMemberExpression(wrapper.alternate) || t.isCallExpression(wrapper.alternate)) {
            parentWrapper.elements[index].alternate = handlePressableFromMemberExpression(t, path, [parentWrapper.elements[index].alternate])
        }

        if (t.isMemberExpression(wrapper.consequent) || t.isCallExpression(wrapper.consequent)) {
            parentWrapper.elements[index].consequent = handlePressableFromMemberExpression(t, path, [parentWrapper.elements[index].consequent])
        }

        return
    }

    if (t.isConditionalExpression(wrapper) && !t.isArrayExpression(parentWrapper)) {
        if (t.isMemberExpression(wrapper.alternate) || t.isCallExpression(wrapper.alternate)) {
            parentWrapper.alternate = handlePressableFromMemberExpression(t, path, [parentWrapper.alternate])
        }

        if (t.isMemberExpression(wrapper.consequent) || t.isCallExpression(wrapper.consequent)) {
            parentWrapper.consequent = handlePressableFromMemberExpression(t, path, [parentWrapper.consequent])
        }

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

    if (t.isCallExpression(wrapper) && t.isArrayExpression(parentWrapper)) {
        parentWrapper.elements[index] = bindCall

        return
    }

    if (t.isCallExpression(wrapper)) {
        styleExpression.body = bindCall
    }
}

function handlePressable(t, path, styleAttr, metadata, state) {
    // add variants
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
        styleAttr.value.expression = handlePressableFromMemberExpression(t, path, metadata, true)

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
        let parentWrapper = t.isBlockStatement(styleExpression.body)
            ? styleExpression.body.body.find(node => t.isReturnStatement(node))
            : styleExpression.body

        if (t.isMemberExpression(parentWrapper)) {
            return
        }

        if (t.isArrayExpression(parentWrapper)) {
            return parentWrapper.elements.forEach((wrapper, index) => handlePressableArgs(t, path, styleExpression, metadata, parentWrapper, wrapper, index))
        }

        if (t.isReturnStatement(parentWrapper)) {
            parentWrapper = parentWrapper.argument

            return handlePressableArgs(t, path, styleExpression, metadata, parentWrapper, parentWrapper)
        }

        const pressableArgs = t.isCallExpression(parentWrapper)
            ? parentWrapper.arguments
            : parentWrapper.argument.arguments
        const callee = t.isCallExpression(parentWrapper)
            ? parentWrapper.callee
            : parentWrapper.argument.callee
        const getBoundArgsCall = t.callExpression(
            t.identifier('getBoundArgs'),
            [callee]
        )
        const bindCall = t.callExpression(
            t.memberExpression(getBoundArgsCall, t.identifier('bind')),
            [t.identifier('undefined'), ...pressableArgs]
        )

        if (t.isCallExpression(parentWrapper)) {
            styleExpression.body = bindCall

            return
        }

        if (parentWrapper) {
            parentWrapper.argument = bindCall
        }

        return
    }

    // {state => style.pressable(state, 1, 2)}
    if (t.isArrowFunctionExpression(styleExpression) && styleExpression.params.length > 0) {
        // user used state with custom args we need to getBoundArgs
        // detect between arrow function with body and arrow function
        let parentWrapper = t.isBlockStatement(styleExpression.body)
            ? styleExpression.body.body.find(node => t.isReturnStatement(node))
            : styleExpression.body

        if (t.isArrayExpression(parentWrapper)) {
            return parentWrapper.elements.forEach((wrapper, index) => handlePressableArgs(t, path, styleExpression, metadata, parentWrapper, wrapper, index))
        }

        if (t.isReturnStatement(parentWrapper)) {
            parentWrapper = parentWrapper.argument
        }

        handlePressableArgs(t, path, styleExpression, metadata, parentWrapper, parentWrapper)
    }
}

module.exports = {
    getStyleMetadata,
    getStyleAttribute,
    styleAttributeToArray,
    handlePressable
}
