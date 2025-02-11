import type { NodePath } from "@babel/core";
import { isJSXAttribute, isJSXIdentifier, isStringLiteral, type JSXElement } from "@babel/types";

export function hasStringRef(path: NodePath<JSXElement>) {
    return path.node.openingElement.attributes.find(attr =>
        isJSXAttribute(attr) &&
        isJSXIdentifier(attr.name, { name: 'ref' }) &&
        isStringLiteral(attr.value)
    )
}
