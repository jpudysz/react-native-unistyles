import { transformSync } from '@babel/core'
import { pluginTester } from 'babel-plugin-tester'

import plugin from '../src/index'

pluginTester({
    plugin,
    pluginOptions: {
        debug: false,
        root: 'src',
    },
    babelOptions: {
        plugins: ['@babel/plugin-syntax-jsx'],
        generatorOpts: {
            retainLines: true,
        },
    },
    tests: [
        {
            title: 'Should add dependencies to every branch of a ternary returned from an arrow function',
            code: `
                import { StyleSheet } from 'react-native-unistyles'

                const styles = StyleSheet.create(({ color }, rt) => ({
                    dropped: ({ on }) => on ? { backgroundColor: color.primary } : { backgroundColor: color.secondary },
                    empty: ({ on }) => (on ? { backgroundColor: color.primary } : {}),
                    counter: (compact) => compact ? { fontSize: 14 * rt.fontScale } : { fontSize: 18 * rt.fontScale }
                }))
            `,
            output: `
                import { StyleSheet } from 'react-native-unistyles'

                const styles = StyleSheet.create(({ color }, rt) => ({
                    dropped: ({ on }) =>
                        on ? { backgroundColor: color.primary, uni__dependencies: [0] } : { backgroundColor: color.secondary, uni__dependencies: [0] },
                    empty: ({ on }) => (on ? { backgroundColor: color.primary, uni__dependencies: [0] } : { uni__dependencies: [0] }),
                    counter: compact =>
                        compact ? { fontSize: 14 * rt.fontScale, uni__dependencies: [11] } : { fontSize: 18 * rt.fontScale, uni__dependencies: [11] }
                }))
            `,
        },
        {
            title: 'Should add dependencies to every branch of a ternary returned from a block body',
            code: `
                import { StyleSheet } from 'react-native-unistyles'

                const styles = StyleSheet.create((theme, rt) => ({
                    arrow: (on) => {
                        return on ? { backgroundColor: theme.colors.primary } : {}
                    },
                    func: function (on) {
                        return on ? { paddingTop: rt.insets.top } : { paddingTop: 0 }
                    },
                    mixed: (on, big) => {
                        if (on) {
                            return big ? { fontSize: 20 * rt.fontScale } : { fontSize: 16 * rt.fontScale }
                        }

                        return { fontSize: 12 * rt.fontScale }
                    }
                }))
            `,
            output: `
                import { StyleSheet } from 'react-native-unistyles'

                const styles = StyleSheet.create((theme, rt) => ({
                    arrow: on => {
                        return on ? { backgroundColor: theme.colors.primary, uni__dependencies: [0] } : { uni__dependencies: [0] }
                    },
                    func: function (on) {
                        return on ? { paddingTop: rt.insets.top, uni__dependencies: [9] } : { paddingTop: 0, uni__dependencies: [9] }
                    },
                    mixed: (on, big) => {
                        if (on) {
                            return big ? { fontSize: 20 * rt.fontScale, uni__dependencies: [11] } : { fontSize: 16 * rt.fontScale, uni__dependencies: [11] }
                        }

                        return { fontSize: 12 * rt.fontScale, uni__dependencies: [11] }
                    }
                }))
            `,
        },
        {
            title: 'Should add dependencies to every branch of a nested ternary',
            code: `
                import { StyleSheet } from 'react-native-unistyles'

                const styles = StyleSheet.create((theme, rt) => ({
                    expression: (size) => size === 'small'
                        ? { fontSize: 12 * rt.fontScale }
                        : size === 'medium'
                            ? { fontSize: 14 * rt.fontScale }
                            : { fontSize: 18 * rt.fontScale, color: theme.colors.text },
                    block: (size) => {
                        return size === 'small' ? { color: theme.colors.primary } : size === 'medium' ? {} : { color: theme.colors.secondary }
                    }
                }))
            `,
            output: `
                import { StyleSheet } from 'react-native-unistyles'

                const styles = StyleSheet.create((theme, rt) => ({
                    expression: size =>
                        size === 'small'
                            ? { fontSize: 12 * rt.fontScale, uni__dependencies: [0, 11] }
                            : size === 'medium'
                              ? { fontSize: 14 * rt.fontScale, uni__dependencies: [0, 11] }
                              : { fontSize: 18 * rt.fontScale, color: theme.colors.text, uni__dependencies: [0, 11] },
                    block: size => {
                        return size === 'small'
                            ? { color: theme.colors.primary, uni__dependencies: [0] }
                            : size === 'medium'
                              ? { uni__dependencies: [0] }
                              : { color: theme.colors.secondary, uni__dependencies: [0] }
                    }
                }))
            `,
        },
        {
            title: 'Should add dependencies to object literals returned from logical expressions',
            code: `
                import { StyleSheet } from 'react-native-unistyles'

                const styles = StyleSheet.create((theme, rt) => ({
                    and: (on) => on && { backgroundColor: theme.colors.primary },
                    or: (big) => (big && { fontSize: 20 * rt.fontScale }) || { fontSize: 14 * rt.fontScale },
                    nullish: (on) => (on ? { color: theme.colors.primary } : null) ?? { color: theme.colors.secondary }
                }))
            `,
            output: `
                import { StyleSheet } from 'react-native-unistyles'

                const styles = StyleSheet.create((theme, rt) => ({
                    and: on => on && { backgroundColor: theme.colors.primary, uni__dependencies: [0] },
                    or: big => (big && { fontSize: 20 * rt.fontScale, uni__dependencies: [11] }) || { fontSize: 14 * rt.fontScale, uni__dependencies: [11] },
                    nullish: on => (on ? { color: theme.colors.primary, uni__dependencies: [0] } : null) ?? { color: theme.colors.secondary, uni__dependencies: [0] }
                }))
            `,
        },
        {
            title: 'Should add dependencies to every branch of a static style',
            code: `
                import { StyleSheet } from 'react-native-unistyles'

                const styles = StyleSheet.create((theme, rt) => ({
                    ternary: rt.isPortrait ? { flexDirection: 'column', gap: theme.gap(1) } : { flexDirection: 'row' },
                    logical: rt.isLandscape && { paddingLeft: rt.insets.left }
                }))
            `,
            output: `
                import { StyleSheet } from 'react-native-unistyles'

                const styles = StyleSheet.create((theme, rt) => ({
                    ternary: rt.isPortrait
                        ? { flexDirection: 'column', gap: theme.gap(1), uni__dependencies: [0, 7] }
                        : { flexDirection: 'row', uni__dependencies: [0, 7] },
                    logical: rt.isLandscape && { paddingLeft: rt.insets.left, uni__dependencies: [7, 9] }
                }))
            `,
        },
        {
            title: 'Should add dependencies to every branch of a ternary wrapped in TypeScript expressions',
            babelOptions: {
                parserOpts: {
                    plugins: ['jsx', 'typescript'],
                },
            },
            code: `
                import { StyleSheet } from 'react-native-unistyles'

                const styles = StyleSheet.create((theme, rt) => ({
                    asConst: (on: boolean) => (on ? { color: theme.colors.primary } : { color: theme.colors.secondary }) as const,
                    satisfies: (on: boolean) => (on ? { paddingTop: rt.insets.top } : {}) satisfies object,
                    typed: (compact: boolean): object => compact ? { fontSize: 14 * rt.fontScale } : { fontSize: 18 * rt.fontScale }
                }))
            `,
            output: `
                import { StyleSheet } from 'react-native-unistyles'

                const styles = StyleSheet.create((theme, rt) => ({
                    asConst: (on: boolean) =>
                        (on ? { color: theme.colors.primary, uni__dependencies: [0] } : { color: theme.colors.secondary, uni__dependencies: [0] }) as const,
                    satisfies: (on: boolean) => (on ? { paddingTop: rt.insets.top, uni__dependencies: [9] } : { uni__dependencies: [9] }) satisfies object,
                    typed: (compact: boolean): object =>
                        compact ? { fontSize: 14 * rt.fontScale, uni__dependencies: [11] } : { fontSize: 18 * rt.fontScale, uni__dependencies: [11] }
                }))
            `,
        },
        {
            title: 'Should keep spreading returned variables',
            code: `
                import { StyleSheet } from 'react-native-unistyles'

                const styles = StyleSheet.create(theme => ({
                    container: (on) => {
                        const style = on ? { backgroundColor: theme.colors.primary } : {}

                        return style
                    }
                }))
            `,
            output: `
                import { StyleSheet } from 'react-native-unistyles'

                const styles = StyleSheet.create(theme => ({
                    container: on => {
                        const style = on ? { backgroundColor: theme.colors.primary } : {}

                        return { ...style, uni__dependencies: [0] }
                    }
                }))
            `,
        },
        {
            title: 'Should leave unsupported returned values untouched',
            code: `
                import { StyleSheet } from 'react-native-unistyles'

                const styles = StyleSheet.create(theme => ({
                    call: () => tint(theme),
                    variable: (on) => {
                        const active = { backgroundColor: theme.colors.primary }

                        return on ? active : { backgroundColor: theme.colors.secondary }
                    },
                    switch: (size) => {
                        switch (size) {
                            case 'small':
                                return { padding: theme.gap(1) }
                            default:
                                return { padding: theme.gap(2) }
                        }
                    }
                }))
            `,
            output: `
                import { StyleSheet } from 'react-native-unistyles'

                const styles = StyleSheet.create(theme => ({
                    call: () => tint(theme),
                    variable: on => {
                        const active = { backgroundColor: theme.colors.primary }

                        return on ? active : { backgroundColor: theme.colors.secondary, uni__dependencies: [0] }
                    },
                    switch: size => {
                        switch (size) {
                            case 'small':
                                return { padding: theme.gap(1) }
                            default:
                                return { padding: theme.gap(2) }
                        }
                    }
                }))
            `,
        },
    ],
})

describe('Babel plugin debug output for returned values', () => {
    const transform = (style: string) => {
        const log = jest.spyOn(console, 'log').mockImplementation(() => {})
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})

        transformSync(
            `
                import { StyleSheet } from 'react-native-unistyles'

                const styles = StyleSheet.create((theme, rt) => ({
                    ${style}
                }))
            `,
            {
                filename: '/app/src/styles.tsx',
                root: '/app',
                babelrc: false,
                configFile: false,
                plugins: [[plugin, { debug: true, root: 'src' }]],
            },
        )

        const result = {
            logs: log.mock.calls.map((args) => args.join(' ')),
            warnings: warn.mock.calls.map((args) => args.join(' ')),
        }

        log.mockRestore()
        warn.mockRestore()

        return result
    }

    it('logs dependencies attached to every branch', () => {
        const { logs, warnings } = transform(
            'counter: (compact) => compact ? { fontSize: 14 * rt.fontScale } : { fontSize: 18 * rt.fontScale }',
        )

        expect(logs).toEqual(['src/styles.tsx: styles.counter: [FontScale]'])
        expect(warnings).toEqual([])
    })

    it('warns when the style returns a call result', () => {
        const { logs, warnings } = transform('tinted: () => tint(theme)')

        expect(logs).toEqual([])
        expect(warnings).toHaveLength(1)
        expect(warnings[0]).toContain('src/styles.tsx: styles.tinted: detected [Theme]')
        expect(warnings[0]).toContain('CallExpression')
    })

    it('warns when a branch is not an object literal', () => {
        const { logs, warnings } = transform(
            'toggle: (on) => { const active = { color: theme.colors.primary }; return on ? active : {} }',
        )

        expect(logs).toEqual([])
        expect(warnings).toHaveLength(1)
        expect(warnings[0]).toContain('styles.toggle: detected [Theme]')
        expect(warnings[0]).toContain('Identifier')
    })

    it('warns about return statements inside a switch', () => {
        const { logs, warnings } = transform(
            "sized: (size) => { switch (size) { case 'small': return { padding: theme.gap(1) }; default: return { padding: theme.gap(2) } } }",
        )

        expect(logs).toEqual([])
        expect(warnings).toHaveLength(1)
        expect(warnings[0]).toContain('styles.sized: detected [Theme]')
        expect(warnings[0]).toContain('2 return statement(s) inside switch, loop or try blocks')
    })

    it('does not warn about falsy branches', () => {
        const { logs, warnings } = transform(
            'optional: (on) => on ? { color: theme.colors.primary } : undefined, other: (on) => on && { color: theme.colors.secondary }',
        )

        expect(logs).toEqual(['src/styles.tsx: styles.optional: [Theme]', 'src/styles.tsx: styles.other: [Theme]'])
        expect(warnings).toEqual([])
    })
})
