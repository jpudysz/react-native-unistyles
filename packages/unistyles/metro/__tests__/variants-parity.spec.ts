// react-native-unistyles/metro runs no Babel transform, components use the styles returned by useVariants
// and codemods/use-variants.js converts them. The Babel plugin's own test cases are the reference:
// every style read the Babel plugin scopes to the variants has to read the styles returned by useVariants after the codemod
import { type NodePath, parseSync, transformSync, type TransformOptions, traverse, types as t } from '@babel/core'
import { applyTransform } from 'jscodeshift/src/testUtils'
import path from 'node:path'

import plugin from '../../plugin/src/index'

type PluginTesterCase = {
    title: string
    code: string
    pluginOptions?: object
    babelOptions?: TransformOptions
}

type PluginTesterConfig = {
    pluginOptions: object
    babelOptions: TransformOptions
    tests: Array<PluginTesterCase>
}

type Case = PluginTesterCase & { spec: string; config: PluginTesterConfig }

const mockCases: Array<Case> = []
let mockSpec = ''

jest.mock('babel-plugin-tester', () => ({
    pluginTester: (config: PluginTesterConfig) => {
        config.tests.forEach((test) => mockCases.push({ ...test, spec: mockSpec, config }))
    },
}))

const SPECS = [
    'conditionalDependencies',
    'dependencies',
    'hostComponents',
    'imports',
    'stylesheet',
    'userImports',
    'variants',
]

// only the plugin tester cases, the specs' own tests run in their files
const { describe: jestDescribe, it: jestIt } = globalThis

Object.assign(globalThis, { describe: () => {}, it: () => {} })
SPECS.forEach((spec) => {
    mockSpec = spec
    require(`../../plugin/__tests__/${spec}.spec`)
})
Object.assign(globalThis, { describe: jestDescribe, it: jestIt })

const codemod = require('../../codemods/use-variants')

const APP_FILE = path.join(__dirname, '../..', 'src', 'fixture.tsx')

const variantCases = mockCases.filter((testCase) => testCase.code.includes('.useVariants('))

const transformWithBabel = (testCase: Case) => {
    const babelOptions = { ...testCase.config.babelOptions, ...testCase.babelOptions }

    return (
        transformSync(testCase.code, {
            babelrc: false,
            configFile: false,
            filename: APP_FILE,
            ...babelOptions,
            plugins: [
                ...(babelOptions.plugins ?? []),
                [plugin, { ...testCase.config.pluginOptions, ...testCase.pluginOptions }],
            ],
        })?.code ?? ''
    )
}

const transformWithCodemod = (testCase: Case) =>
    applyTransform(codemod, {}, { source: testCase.code, path: 'Component.tsx' }, { parser: 'tsx' })

type UseVariantsCall = { variants: string; reads: Array<string> }

// every `const x = stylesheet.useVariants(...)` and what is read from `x`, in source order
const getUseVariantsCalls = (code: string) => {
    const ast = parseSync(code, {
        babelrc: false,
        configFile: false,
        filename: APP_FILE,
        parserOpts: { plugins: ['jsx', 'typescript'] },
    })
    const calls: Array<UseVariantsCall & { start: number }> = []
    const statements: Array<string> = []

    traverse(ast!, {
        ExpressionStatement(statementPath) {
            const { expression } = statementPath.node

            if (
                t.isCallExpression(expression) &&
                t.isMemberExpression(expression.callee) &&
                t.isIdentifier(expression.callee.property, { name: 'useVariants' })
            ) {
                statements.push(code.slice(expression.start!, expression.end!))
            }
        },
        VariableDeclarator(declaratorPath: NodePath<t.VariableDeclarator>) {
            const { id, init } = declaratorPath.node

            if (
                !t.isIdentifier(id) ||
                !t.isCallExpression(init) ||
                !t.isMemberExpression(init.callee) ||
                !t.isIdentifier(init.callee.property, { name: 'useVariants' })
            ) {
                return
            }

            const binding = declaratorPath.scope.getBinding(id.name)
            const reads = (binding?.referencePaths ?? [])
                .slice()
                .sort((a, b) => a.node.start! - b.node.start!)
                .map((reference) => {
                    const parent = reference.parent

                    if (t.isMemberExpression(parent) && parent.object === reference.node) {
                        return t.isIdentifier(parent.property)
                            ? parent.property.name
                            : t.isStringLiteral(parent.property)
                              ? parent.property.value
                              : '[computed]'
                    }

                    return '<styles>'
                })

            calls.push({
                start: init.start!,
                variants: code.slice(init.arguments[0]!.start!, init.arguments[0]!.end!).replace(/\s+/g, ' '),
                reads,
            })
        },
    })

    return {
        // useVariants calls whose result isn't used
        statements,
        calls: calls.sort((a, b) => a.start - b.start).map(({ variants, reads }) => ({ variants, reads })),
    }
}

describe('codemods/use-variants matches the scopes of the Babel plugin', () => {
    it('should run every test case of the Babel plugin with useVariants', () => {
        expect(new Set(variantCases.map((testCase) => testCase.spec))).toEqual(new Set(['variants']))
        expect(variantCases.length).toBeGreaterThanOrEqual(6)
    })

    describe.each(variantCases.map((testCase) => [`${testCase.spec}: ${testCase.title}`, testCase] as const))(
        '%s',
        (_, testCase) => {
            it('should read the same styles from the result of useVariants', () => {
                const babel = getUseVariantsCalls(transformWithBabel(testCase))
                const codemod = getUseVariantsCalls(transformWithCodemod(testCase))

                expect(babel.calls.length).toBeGreaterThan(0)
                expect(codemod).toEqual(babel)
            })
        },
    )
})
