import { transformSync } from '@babel/core'

import { UnistyleDependency } from '../../src/specs/NativePlatform/NativePlatform.nitro'
import { extractUnistyleDependencies } from '../../src/web/utils'
import plugin from '../src/index'

jest.mock('../../src/web/services', () => ({}))

type StyleFn = (...args: Array<unknown>) => Record<string, unknown>

// compiles a StyleSheet with the plugin and evaluates it like the runtime would
const createStyles = (styles: string) => {
    const result = transformSync(`const styles = StyleSheet.create((theme, rt) => ({ ${styles} }))`, {
        filename: '/app/src/styles.ts',
        babelrc: false,
        configFile: false,
        plugins: [[plugin, { isMetro: true }]],
    })
    const theme = { colors: { primary: 'red', secondary: 'blue' } }
    const rt = { fontScale: 2, isPortrait: true }
    const StyleSheet = { create: (stylesheet: Function) => stylesheet(theme, rt) }

    return new Function('StyleSheet', `${result?.code}; return styles`)(StyleSheet) as Record<string, StyleFn>
}

describe('Babel plugin dependencies at runtime', () => {
    it('exposes the same dependencies from every branch of a returned ternary', () => {
        const styles = createStyles(`
            counter: (compact) => compact ? { fontSize: 14 * rt.fontScale } : { fontSize: 18 * rt.fontScale },
            toggle: (on) => on ? { backgroundColor: theme.colors.primary } : {}
        `)

        expect(styles.counter!(true).fontSize).toBe(28)
        expect(extractUnistyleDependencies(styles.counter!(true))).toEqual([UnistyleDependency.FontScale])
        expect(extractUnistyleDependencies(styles.counter!(false))).toEqual([UnistyleDependency.FontScale])

        // native reads dependencies only from the first call, so the empty branch must carry them too
        expect(extractUnistyleDependencies(styles.toggle!(false))).toEqual([UnistyleDependency.Theme])
        expect(extractUnistyleDependencies(styles.toggle!(true))).toEqual([UnistyleDependency.Theme])
    })

    it('exposes dependencies from a block body and a logical expression', () => {
        const styles = createStyles(`
            block: function (on) { return on ? { color: theme.colors.primary } : { color: theme.colors.secondary } },
            fallback: (big) => (big && { fontSize: 20 * rt.fontScale }) || { fontSize: 14 * rt.fontScale }
        `)

        expect(extractUnistyleDependencies(styles.block!(true))).toEqual([UnistyleDependency.Theme])
        expect(extractUnistyleDependencies(styles.block!(false))).toEqual([UnistyleDependency.Theme])
        expect(extractUnistyleDependencies(styles.fallback!(true))).toEqual([UnistyleDependency.FontScale])
        expect(extractUnistyleDependencies(styles.fallback!(false))).toEqual([UnistyleDependency.FontScale])
    })

    it('exposes dependencies from a static ternary', () => {
        const styles = createStyles(`
            row: rt.isPortrait ? { flexDirection: 'column', color: theme.colors.primary } : { flexDirection: 'row' }
        `)

        expect(extractUnistyleDependencies(styles.row)).toEqual([
            UnistyleDependency.Theme,
            UnistyleDependency.Orientation,
        ])
    })
})
