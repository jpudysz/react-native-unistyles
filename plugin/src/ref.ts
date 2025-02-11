import { isJSXAttribute, isJSXIdentifier, isStringLiteral } from "@babel/types";

export function hasStringRef(path) {
    return path.node.openingElement.attributes.find(attr =>
        isJSXAttribute(attr) &&
        isJSXIdentifier(attr.name, { name: 'ref' }) &&
        isStringLiteral(attr.value)
    )
}
