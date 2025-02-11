import type { NodePath } from '@babel/core'
import { type JSXElement, isJSXAttribute, isJSXIdentifier, isStringLiteral } from '@babel/types'

export function hasStringRef(path: NodePath<JSXElement>) {
    return path.node.openingElement.attributes.find(attr =>
        isJSXAttribute(attr) &&
        isJSXIdentifier(attr.name, { name: 'ref' }) &&
        isStringLiteral(attr.value)
    )
}
