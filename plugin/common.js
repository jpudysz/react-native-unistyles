function getIdentifierNameFromExpression(t, memberExpression, rootStyleKey) {
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
        ].flat().find(Boolean)
    }

    if (t.isConditionalExpression(memberExpression)) {
        return [
            getIdentifierNameFromExpression(t, memberExpression.test.left),
            getIdentifierNameFromExpression(t, memberExpression.test.right),
            getIdentifierNameFromExpression(t, memberExpression.alternate),
            getIdentifierNameFromExpression(t,memberExpression.consequent),
        ].flat()
    }

    if (t.isArrowFunctionExpression(memberExpression)) {
        return memberExpression.body.properties.map(prop => getIdentifierNameFromExpression(t, prop.value)).flat()
    }

    if (t.isTemplateLiteral(memberExpression)) {
        return memberExpression.expressions.map(expression => getIdentifierNameFromExpression(t, expression)).flat()
    }

    if (t.isObjectExpression(memberExpression) && rootStyleKey === 'variants') {
        return memberExpression.properties
            .filter(t.isObjectProperty)
            // first level
            .flatMap(property => property.value.properties)
            .filter(t.isObjectProperty)
            // second level
            .flatMap(property => property.value.properties)
            .filter(t.isObjectProperty)
            // last level key-value
            .flatMap(property => t.isObjectProperty(property.value)
                ? property.value.object
                : t.isBinaryExpression(property.value)
                    ? [property.value.left, property.value.right]
                    : undefined
            )
            .flatMap(expression => t.isIdentifier(expression)
                ? expression.name
                : getIdentifierNameFromExpression(t, expression)
            )
    }

    return []
}

function getSecondPropertyName(t, memberExpression, rootStyleKey) {
    if (t.isConditionalExpression(memberExpression)) {
        return [
            getSecondPropertyName(t, memberExpression.test.left),
            getSecondPropertyName(t, memberExpression.test.right),
            getSecondPropertyName(t, memberExpression.alternate),
            getSecondPropertyName(t, memberExpression.consequent),
        ].flat().find(Boolean)
    }

    if (t.isTemplateLiteral(memberExpression)) {
        return memberExpression.expressions.map(expression => getSecondPropertyName(t, expression)).flat().find(Boolean)
    }

    if (t.isBinaryExpression(memberExpression)) {
        return [
            getSecondPropertyName(t, memberExpression.left),
            getSecondPropertyName(t, memberExpression.right)
        ].flat()
    }

    if (t.isObjectExpression(memberExpression) && rootStyleKey === 'variants') {
        return memberExpression.properties
            .filter(t.isObjectProperty)
            // first level
            .flatMap(property => property.value.properties)
            .filter(t.isObjectProperty)
            // second level
            .flatMap(property => property.value.properties)
            .filter(t.isObjectProperty)
            // last level key-value
            .flatMap(property => getSecondPropertyName(t, property.value))
            .find(Boolean)
    }

    if (!t.isMemberExpression(memberExpression)) {
        return null
    }

    let current = memberExpression
    let propertyName = null

    while (t.isMemberExpression(current)) {
        propertyName = current.property
        current = current.object
    }

    if (propertyName && t.isIdentifier(propertyName)) {
        return propertyName.name
    }

    if (propertyName) {
        return propertyName.value
    }

    return null
}

module.exports = {
    getIdentifierNameFromExpression,
    getSecondPropertyName
}
