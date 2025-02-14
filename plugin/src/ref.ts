import type { NodePath } from '@babel/core'
import * as t from '@babel/types'

export function hasStringRef(path: NodePath<t.JSXElement>) {
    return path.node.openingElement.attributes.find(attr =>
        t.isJSXAttribute(attr) &&
        t.isJSXIdentifier(attr.name, { name: 'ref' }) &&
        t.isStringLiteral(attr.value)
    )
}
