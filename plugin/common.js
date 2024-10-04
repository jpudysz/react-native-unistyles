function getIdentifierNameFromExpression(t, memberExpression) {
    if (t.isMemberExpression(memberExpression)) {
        const object = memberExpression.object

        // If the object is an Identifier, return its name
        if (t.isIdentifier(object)) {
            return [object.name]
        }

        // If the object is another MemberExpression, recursively get the identifier
        if (t.isMemberExpression(object)) {
            return getIdentifierNameFromExpression(t, object).flat()
        }

        // If the object is a computed property, it may also be an Identifier
        if (t.isMemberExpression(object) && t.isIdentifier(object.property)) {
            return [object.object.name]
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
            getIdentifierNameFromExpression(t,memberExpression.consequent),
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

    return []
}

function getSecondPropertyName(t, memberExpression) {
    if (t.isConditionalExpression(memberExpression)) {
        return [
            getSecondPropertyName(t, memberExpression.test.left),
            getSecondPropertyName(t, memberExpression.test.right),
            getSecondPropertyName(t, memberExpression.alternate),
            getSecondPropertyName(t, memberExpression.consequent),
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

    let current = memberExpression
    let propertyName = null

    while (t.isMemberExpression(current)) {
        propertyName = current.property
        current = current.object
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
