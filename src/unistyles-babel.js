const fs = require('fs')
const generate = require('@babel/generator').default

module.exports = babel => {
    const { types: t } = babel

    const transformBreakpoints = (path, breakpoints) => {
        // sort the breakpoints to get Array of tuples <[string, number]>
        const sortedPairs = breakpoints.properties
            .map(prop => {
                if (t.isNumericLiteral(prop.value) && t.isIdentifier(prop.key)) {
                    return t.arrayExpression([
                        t.stringLiteral(prop.key.name),
                        t.numericLiteral(prop.value.value)
                    ])
                }
            })
            .sort((a, b) => {
                if (a.elements && b.elements) {
                    return a.elements[1].value - b.elements[1].value
                }

                return 0
            })

        const sortedPairsArray = t.arrayExpression(sortedPairs)

        // save it as next argument
        path.node.arguments.push(sortedPairsArray)

        // sort object values too for sake of simplicity
        const tsProperties = sortedPairs.map(pair => {
            if (pair.elements) {
                const key = pair.elements[0].value
                const value = pair.elements[1].value

                return t.tsPropertySignature(
                    t.identifier(key),
                    t.tsTypeAnnotation(t.tsLiteralType(t.numericLiteral(value)))
                )
            }
        })

        // create 'declare module' type
        const moduleDeclaration = t.declareModule(
            t.stringLiteral('unistyles:static'),
            t.blockStatement([
                t.tsTypeAliasDeclaration(
                    t.identifier('UnistylesBreakpoints'),
                    null,
                    t.tsTypeLiteral(tsProperties)
                )
            ])
        )

        // convert to string
        const output = generate(moduleDeclaration).code

        if (!fs.existsSync('.unistyles')) {
            fs.mkdirSync('.unistyles')
        }

        fs.writeFileSync('.unistyles/unistyles.d.ts', output, 'utf8')
    }

    return {
        name: 'unistyles',
        visitor: {
            CallExpression: path => {
                const callee = path.node.callee

                if (!t.isMemberExpression(callee) || !t.isMemberExpression(callee.object)) {
                    return
                }

                // look for Unistyles.Static.registerBreakpoints()
                const isUnistyles = t.isIdentifier(callee.object.object, { name: 'Unistyles' })
                const isStatic = t.isIdentifier(callee.object.property, { name: 'Static' })
                const isCallingRegisterBreakpoints = t.isIdentifier(callee.property, { name: 'registerBreakpoints' })

                if (!isUnistyles || !isStatic || !isCallingRegisterBreakpoints) {
                    return
                }

                // get registerBreakpoints() arguments
                const args = path.node.arguments

                if (args.length === 0) {
                    return
                }

                const breakpoints = args.at(0)

                if (!t.isObjectExpression(breakpoints)) {
                    return
                }

                // everything is good, transform it!
                transformBreakpoints(path, breakpoints)
            }
        }
    }
}
