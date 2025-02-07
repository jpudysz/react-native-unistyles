export function hasStringRef(t, path) {
    return path.node.openingElement.attributes.find(attr =>
        t.isJSXAttribute(attr) &&
        t.isJSXIdentifier(attr.name, { name: 'ref' }) &&
        t.isStringLiteral(attr.value)
    )
}
