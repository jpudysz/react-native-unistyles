const generate = require('@babel/generator').default
const Helpers = require('./helpers')

const plugin = babel => {
    const { types: t } = babel

    const sortBreakpointsAndInject = (path, breakpoints) => {
        Helpers.log('Registering breakpoints...')

        const sortedPairs = Helpers.sortBreakpoints(t, breakpoints)
        const sortedPairsArray = t.arrayExpression(sortedPairs)

        // inject it to registerBreakpoints
        path.node.arguments.push(sortedPairsArray)
    }

    const declareBreakpoints = breakpoints => {
        const sortedPairs = Helpers.sortBreakpoints(t, breakpoints)
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

        const output = generate(moduleDeclaration).code

        Helpers.saveModuleDeclaration('breakpoints.d.ts', output)
    }

    const declareThemes = (path, themes) => {
        Helpers.log('Registering themes...')

        const [firstTheme, ...otherThemes] = themes.map(theme => Helpers.resolveValue(theme, path.scope))
        const firstThemeStructure = Helpers
            .getObjectStructure(firstTheme)
            .sort()
            .toString()

        const allThemesAreTheSame = otherThemes
            .every(theme => Helpers.getObjectStructure(theme).sort().toString() === firstThemeStructure)

        if (!allThemesAreTheSame) {
            Helpers.error('Theme structure differs. Create the same structure to generate the TypeScript type')
        }

        const determineTsType = value => {
            switch (typeof value) {
                case 'string':
                    return t.tsStringKeyword()
                case 'number':
                    return t.tsNumberKeyword()
                case 'boolean':
                    return t.tsBooleanKeyword()
                case 'object':
                    if (value === null) {
                        return t.tsNullKeyword()
                    }

                    return t.tsTypeLiteral(createTsProperties(value))
                default:
                    return t.tsUnknownKeyword()
            }
        }

        const createTsProperties = resolvedObject => {
            return Object
                .entries(resolvedObject)
                .reduce((acc, [key, value]) => {
                    const tsType = determineTsType(value)
                    const propertySignature = t.tsPropertySignature(
                        t.identifier(key),
                        t.tsTypeAnnotation(tsType)
                    )

                    return acc.concat(propertySignature)
                }, [])
        }

        const tsProperties = createTsProperties(firstTheme)

        // create 'declare module' type
        const moduleDeclaration = t.declareModule(
            t.stringLiteral('unistyles:static'),
            t.blockStatement([
                t.tsTypeAliasDeclaration(
                    t.identifier('UnistylesTheme'),
                    null,
                    t.tsTypeLiteral(tsProperties)
                )
            ])
        )

        const output = generate(moduleDeclaration).code

        Helpers.saveModuleDeclaration('themes.d.ts', output)
    }

    return {
        name: 'unistyles',
        visitor: {
            CallExpression: (path, state) => {
                const callee = path.node.callee

                if (!Helpers.isUnistyles(t, callee)) {
                    return
                }

                const breakpoints = Helpers.getBreakpoints(t, callee, path)

                // skip sorting in the runtime, inject sortedMap to the registerBreakpoints
                if (breakpoints) {
                    sortBreakpointsAndInject(path, breakpoints)
                }

                // further processing only for TypeScript
                if (!Helpers.isTypeScriptFile(state)) {
                    return
                }

                if (breakpoints) {
                    declareBreakpoints(breakpoints)
                }

                const themes = Helpers.getThemes(t, callee, path)

                if (themes) {
                    declareThemes(path, themes)
                }
            }
        }
    }
}

module.exports = plugin

// PLAYGROUND

// const babel = require('@babel/core')
// const code = `
// import { Unistyles } from 'react-native-unistyles'
//
// const sharedColors = {
//     barbie: '#ff9ff3',
//     oak: '#1dd1a1',
//     sky: '#48dbfb',
//     fog: '#c8d6e5',
//     aloes: '#00d2d3'
// }
//
// const lightTheme = {
//     colors: {
//         ...sharedColors,
//         backgroundColor: '#ffffff',
//         typography: '#000000'
//     }
//     // add any keys/functions/objects/arrays you want!
// }
//
// const darkTheme = {
//     colors: {
//         ...sharedColors,
//         backgroundColor: '#000000',
//         typography: '#ffffff'
//     }
//     // add any keys/functions/objects/arrays you want!
// }
//
// Unistyles.Static.registerThemes({
//     light: lightTheme,
//     dark: darkTheme,
//     custom: lightTheme
// })
// `

// const output = babel.transform(code, {
//     plugins: [plugin]
// })
