import { applyTransform } from 'jscodeshift/src/testUtils'

const transform = require('../use-variants')

const run = (source: string) => applyTransform(transform, {}, { source, path: 'Component.tsx' }, { parser: 'tsx' })

describe('codemods/use-variants', () => {
    it('should use the styles returned by useVariants', () => {
        const output = run(`
const Badge = ({ size }) => {
    styles.useVariants({ size })

    return <View style={styles.badge} />
}

const styles = StyleSheet.create({ badge: { variants: { size: { small: {} } } } })
`)

        // recast adds semicolons to the statements it prints
        expect(output).toContain('const variantStyles = styles.useVariants({ size });')
        expect(output).toContain('return <View style={variantStyles.badge} />')
        expect(output).toContain('const styles = StyleSheet.create({ badge: { variants: { size: { small: {} } } } })')
    })

    it('should keep reads above the call, types and other components', () => {
        const output = run(`
type Props = UnistylesVariants<typeof styles>

function Badge({ size }: Props) {
    const base = styles.badge
    styles.useVariants({ size })

    return <View style={[base, styles.badge]} />
}

function Plain() {
    return <View style={styles.badge} />
}
`)

        expect(output).toContain('UnistylesVariants<typeof styles>')
        expect(output).toContain('const base = styles.badge')
        expect(output).toContain('const variantStyles = styles.useVariants({ size })')
        expect(output).toContain('style={[base, variantStyles.badge]}')
        expect(output).toContain('function Plain() {\n    return <View style={styles.badge} />')
    })

    it('should update callbacks and shorthand properties, but not property names', () => {
        const output = run(`
function List({ tone }) {
    styles.useVariants({ tone })

    const config = { styles, other: styles.row }
    const item = { styles: 1 }

    return <FlatList renderItem={() => <View style={styles.row} />} extraData={item.styles} />
}
`)

        expect(output).toContain('const config = { styles: variantStyles, other: variantStyles.row }')
        expect(output).toContain('const item = { styles: 1 }')
        expect(output).toContain('renderItem={() => <View style={variantStyles.row} />}')
        expect(output).toContain('extraData={item.styles}')
    })

    it('should scope a second call from the original StyleSheet', () => {
        const output = run(`
function Card({ a, b }) {
    styles.useVariants({ size: a })
    const first = styles.card
    styles.useVariants({ size: b })

    return [first, styles.card]
}
`)

        expect(output).toContain('const variantStyles = styles.useVariants({ size: a })')
        expect(output).toContain('const first = variantStyles.card')
        expect(output).toContain('const variantStyles2 = styles.useVariants({ size: b })')
        expect(output).toContain('return [first, variantStyles2.card]')
    })

    it('should name the result after other StyleSheets and avoid used names', () => {
        const output = run(`
const variantStyles = 1

function Card({ size }) {
    cardStyles.useVariants({ size })
    styles.useVariants({ size })

    return [cardStyles.card, styles.card]
}
`)

        expect(output).toContain('const cardStylesWithVariants = cardStyles.useVariants({ size })')
        expect(output).toContain('const variantStyles2 = styles.useVariants({ size })')
        expect(output).toContain('return [cardStylesWithVariants.card, variantStyles2.card]')
    })

    it("should leave a shadowed StyleSheet and code that doesn't call useVariants", () => {
        const output = run(`
function Card({ size }) {
    styles.useVariants({ size })

    const render = (styles) => styles.card

    return render(styles)
}
`)

        expect(output).toContain('const render = (styles) => styles.card')
        expect(output).toContain('return render(variantStyles)')

        const untouched = `const a = styles.useVariants({ size })\n`

        expect(run(untouched)).toBe(untouched.trim())
    })
})
