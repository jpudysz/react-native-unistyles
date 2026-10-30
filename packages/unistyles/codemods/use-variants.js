/**
 * Without the Babel plugin (react-native-unistyles/metro), `useVariants` doesn't change the StyleSheet,
 * it returns the styles with the selected variants:
 *
 *     styles.useVariants({ size })    ->    const variantStyles = styles.useVariants({ size })
 *
 * Every `styles` read below the call, in the same block (also in callbacks and JSX), reads `variantStyles` instead,
 * up to the next call in that block or in a nested one.
 * like the Babel plugin scoped it. Reads above the call and types (`typeof styles`) keep the StyleSheet.
 *
 * npx jscodeshift --parser=tsx --extensions=tsx,ts,jsx,js -t node_modules/react-native-unistyles/codemods/use-variants.js src
 */

const isUseVariantsStatement = (node) =>
    node.type === 'ExpressionStatement' &&
    node.expression.type === 'CallExpression' &&
    node.expression.arguments.length === 1 &&
    node.expression.callee.type === 'MemberExpression' &&
    !node.expression.callee.computed &&
    node.expression.callee.object.type === 'Identifier' &&
    node.expression.callee.property.type === 'Identifier' &&
    node.expression.callee.property.name === 'useVariants'

const isAfter = (node, statement) =>
    node.loc.start.line > statement.loc.end.line ||
    (node.loc.start.line === statement.loc.end.line && node.loc.start.column >= statement.loc.end.column)

const contains = (block, node) =>
    (block.loc.start.line < node.loc.start.line ||
        (block.loc.start.line === node.loc.start.line && block.loc.start.column <= node.loc.start.column)) &&
    (node.loc.end.line < block.loc.end.line ||
        (node.loc.end.line === block.loc.end.line && node.loc.end.column <= block.loc.end.column))

// identifiers that don't read the variable, eg. `obj.styles`, `{ styles: 1 }` or `typeof styles`
const isReference = (path) => {
    const parent = path.parent.node
    const node = path.node

    switch (parent.type) {
        case 'MemberExpression':
        case 'OptionalMemberExpression':
            return parent.object === node || parent.computed
        case 'ObjectProperty':
        case 'Property':
            return parent.value === node || (parent.computed && parent.key === node)
        case 'ClassProperty':
        case 'ClassMethod':
        case 'ObjectMethod':
        case 'MethodDefinition':
            return parent.computed && parent.key === node
        case 'TSTypeQuery':
        case 'TSQualifiedName':
        case 'TSPropertySignature':
        case 'LabeledStatement':
        case 'BreakStatement':
        case 'ContinueStatement':
        case 'ImportSpecifier':
        case 'ImportDefaultSpecifier':
        case 'ExportSpecifier':
            return false
        default:
            return true
    }
}

module.exports = function transformer(file, api) {
    const j = api.jscodeshift
    const root = j(file.source)
    const usedNames = new Set(
        root
            .find(j.Identifier)
            .nodes()
            .map((node) => node.name),
    )
    const getName = (styleSheetName) => {
        const base = styleSheetName === 'styles' ? 'variantStyles' : `${styleSheetName}WithVariants`
        let name = base
        let index = 2

        while (usedNames.has(name)) {
            name = `${base}${index++}`
        }

        usedNames.add(name)

        return name
    }

    // every call starts a scope that ends with its block, a later call (also in a nested block) starts a new one
    const calls = root
        .find(j.ExpressionStatement)
        .filter((path) => isUseVariantsStatement(path.node) && path.parent.node.type === 'BlockStatement')
        .paths()
        .map((statementPath) => {
            const styleSheet = statementPath.node.expression.callee.object

            return {
                statementPath,
                block: statementPath.parent.node,
                styleSheetName: styleSheet.name,
                scope: statementPath.scope.lookup(styleSheet.name),
                name: getName(styleSheet.name),
            }
        })
    // useVariants is always called on the StyleSheet, like the Babel plugin does
    const callees = new Set(calls.map((call) => call.statementPath.node.expression.callee.object))

    // resolved before anything is replaced, replaced nodes have no location
    const replacements = root
        .find(j.Identifier)
        .filter((path) => !callees.has(path.node) && path.node.loc && isReference(path))
        .paths()
        .map((path) => {
            // the closest call above the read, of the same StyleSheet, in a block around it
            const call = calls
                .filter(
                    (candidate) =>
                        candidate.styleSheetName === path.node.name &&
                        contains(candidate.block, path.node) &&
                        isAfter(path.node, candidate.statementPath.node) &&
                        path.scope.lookup(path.node.name) === candidate.scope,
                )
                .at(-1)

            return { path, call }
        })
        .filter(({ call }) => call !== undefined)

    replacements.forEach(({ path, call }) => {
        const parent = path.parent.node

        // { styles } -> { styles: variantStyles }
        if ((parent.type === 'ObjectProperty' || parent.type === 'Property') && parent.shorthand) {
            parent.shorthand = false
            parent.value = j.identifier(call.name)

            return
        }

        path.replace(j.identifier(call.name))
    })

    calls.forEach(({ statementPath, name }) => {
        const declaration = j.variableDeclaration('const', [
            j.variableDeclarator(j.identifier(name), statementPath.node.expression),
        ])

        declaration.comments = statementPath.node.comments
        statementPath.replace(declaration)
    })

    return calls.length > 0 ? root.toSource() : file.source
}

module.exports.parser = 'tsx'
