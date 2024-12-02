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

function metadataToRawStyle(t, metadata, styleExpression) {
    const expressions = []

    metadata.forEach(meta => {
        if (meta.inlineStyle) {
            return meta.inlineStyle.properties.forEach(prop => {
                if (t.isObjectProperty(prop)) {
                    expressions.push(t.objectExpression([prop]))
                }
            })
        }

        // this is identifier
        if (meta.members.length === 1) {
            return expressions.push(t.identifier(meta.members[0]))
        }

        // this is member expression
        if (meta.members.length >= 2) {
            return expressions.push(t.memberExpression(...meta.members.map(member => t.identifier(member))))
        }

        if (meta.logicalExpression) {
            const expression = t.cloneNode(meta.logicalExpression)

            if (t.isIdentifier(expression.left)) {
                if (t.isCallExpression(expression.right)) {
                    expression.right = expression.right.callee
                }

                expressions.push(expression)
            }
        }

        if (meta.conditionalExpression) {
            const expression = t.cloneNode(meta.conditionalExpression)

            if (t.isCallExpression(expression.alternate)) {
                expression.alternate = expression.alternate.callee
            }

            if (t.isCallExpression(expression.consequent)) {
                expression.consequent = expression.consequent.callee
            }

            expressions.push(expression)
        }
    })

    if (t.isArrowFunctionExpression(styleExpression) && styleExpression.params.length === 1) {
        return t.jsxAttribute(
            t.jsxIdentifier('rawStyle'),
            t.jsxExpressionContainer(
                t.arrowFunctionExpression(styleExpression.params, t.arrayExpression([
                ...expressions
                ])
            ))
        )
    }

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
    path.node.openingElement.attributes.push(metadataToRawStyle(t, metadata, styleAttr.value.expression))

    // to add import
    state.file.hasAnyUnistyle = true

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
