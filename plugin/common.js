function getIdentifierNameFromExpression(t, memberExpression) {
    if (t.isIdentifier(memberExpression)) {
        return [memberExpression.name]
    }

    if (t.isSpreadElement(memberExpression)) {
        return [getIdentifierNameFromExpression(t, memberExpression.argument)].flat()
    }

    if (t.isObjectProperty(memberExpression)) {
        return [getIdentifierNameFromExpression(t, memberExpression.value)].flat()
    }

    if (t.isMemberExpression(memberExpression)) {
        if (memberExpression.computed) {
            return [
                getIdentifierNameFromExpression(t, memberExpression.property),
                getIdentifierNameFromExpression(t, memberExpression.object)
            ].flat()
        }

        const object = memberExpression.object

        // If the object is an Identifier, return its name
        if (t.isIdentifier(object)) {
            return [object.name]
        }

        // If the object is another MemberExpression, recursively get the identifier
        if (t.isMemberExpression(object)) {
            return getIdentifierNameFromExpression(t, object).flat()
        }
    }

    if (t.isBinaryExpression(memberExpression)) {
        return [
            getIdentifierNameFromExpression(t, memberExpression.left),
            getIdentifierNameFromExpression(t, memberExpression.right)
        ].flat()
    }

    if (t.isCallExpression(memberExpression)) {
        return getIdentifierNameFromExpression(t, memberExpression.callee)
    }

    if (t.isConditionalExpression(memberExpression)) {
        return [
            getIdentifierNameFromExpression(t, memberExpression.test.left),
            getIdentifierNameFromExpression(t, memberExpression.test.right),
            getIdentifierNameFromExpression(t, memberExpression.alternate),
            getIdentifierNameFromExpression(t, memberExpression.consequent),
            getIdentifierNameFromExpression(t, memberExpression.test)
        ].flat()
    }

    if (t.isArrayExpression(memberExpression)) {
        return memberExpression.elements.map(expression => getIdentifierNameFromExpression(t, expression)).flat()
    }

    if (t.isArrowFunctionExpression(memberExpression)) {
        return memberExpression.body.properties.map(prop => getIdentifierNameFromExpression(t, prop.value)).flat()
    }

    if (t.isTemplateLiteral(memberExpression)) {
        return memberExpression.expressions.map(expression => getIdentifierNameFromExpression(t, expression)).flat()
    }

    if (t.isObjectExpression(memberExpression)) {
        return memberExpression.properties
            .filter(property => t.isObjectProperty(property))
            .flatMap(property => getIdentifierNameFromExpression(t, property.value))
    }

    if (t.isUnaryExpression(memberExpression)) {
        return getIdentifierNameFromExpression(t, memberExpression.argument.object)
    }

    return []
}

function getSecondPropertyName(t, memberExpression) {
    if (t.isUnaryExpression(memberExpression)) {
        return getSecondPropertyName(t, memberExpression.argument.object)
    }

    if (t.isConditionalExpression(memberExpression)) {
        return [
            getSecondPropertyName(t, memberExpression.test.left),
            getSecondPropertyName(t, memberExpression.test.right),
            getSecondPropertyName(t, memberExpression.alternate),
            getSecondPropertyName(t, memberExpression.consequent),
            getSecondPropertyName(t, memberExpression.test)
        ].flat()
    }

    if (t.isTemplateLiteral(memberExpression)) {
        return memberExpression.expressions.map(expression => getSecondPropertyName(t, expression)).flat()
    }

    if (t.isBinaryExpression(memberExpression)) {
        return [
            getSecondPropertyName(t, memberExpression.left),
            getSecondPropertyName(t, memberExpression.right)
        ].flat()
    }

    if (t.isObjectExpression(memberExpression)) {
        return memberExpression.properties
            .filter(property => t.isObjectProperty(property))
            .flatMap(property => getSecondPropertyName(t, property.value))
    }

    if (t.isArrayExpression(memberExpression)) {
        return memberExpression.elements.map(expression => getSecondPropertyName(t, expression)).flat()
    }

    if (!t.isMemberExpression(memberExpression)) {
        return []
    }

    let current = memberExpression.computed
        ? memberExpression.property
        : memberExpression
    let propertyName = null

    while (t.isMemberExpression(current)) {
        propertyName = current.property
        current = current.object
    }

    // special case for IME
    if (propertyName && t.isIdentifier(propertyName) && propertyName.name === 'insets') {
        if (t.isIdentifier(memberExpression.property) && memberExpression.property.name === "ime") {
            return [memberExpression.property.name]
        }

        return [propertyName.name]
    }

    if (propertyName && t.isIdentifier(propertyName)) {
        return [propertyName.name]
    }

    if (propertyName) {
        return [propertyName.value]
    }

    return []
}

module.exports = {
    getIdentifierNameFromExpression,
    getSecondPropertyName
}
