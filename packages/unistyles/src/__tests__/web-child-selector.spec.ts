import * as unistyles from '../web/services'

// Child styles are registered under a `.hash > *` selector, while the class name
// put on the element is that same hash without the ` > *` suffix. If the hash was
// derived from the style value alone, an identical style used by a regular
// component would receive the very same class name and inherit the child rule.
const toClassName = (hash: string) => hash.replace(' > *', '')

describe('web child selector class names', () => {
    const registry = unistyles.services.registry

    it('does not reuse the element class name for child styles', () => {
        const child = registry.add({ flex: 1 }, true)
        const element = registry.add({ flex: 1 })

        expect(child.hash).toBe(`${toClassName(child.hash)} > *`)
        expect(toClassName(child.hash)).not.toBe(element.hash)
    })

    it('does not emit a child selector scoped to a class used by element styles', () => {
        const child = registry.add({ marginTop: 7 }, true)
        const element = registry.add({ marginTop: 7 })
        const styles = registry.css.getStyles()

        expect(styles).toContain(`.${toClassName(child.hash)} > *{margin-top:7px;}`)
        expect(styles).toContain(`.${element.hash}{margin-top:7px;}`)
        // the leak: the element's own class must not also be a child-selector root
        expect(styles).not.toContain(`.${element.hash} > *`)
    })

    it('reuses one class name for identical element styles', () => {
        const first = registry.add({ paddingLeft: 11 })
        const second = registry.add({ paddingLeft: 11 })

        expect(second.hash).toBe(first.hash)
        expect(second.existingHash).toBe(true)
    })

    it('reuses one class name for identical child styles', () => {
        const first = registry.add({ paddingRight: 13 }, true)
        const second = registry.add({ paddingRight: 13 }, true)

        expect(second.hash).toBe(first.hash)
        expect(second.existingHash).toBe(true)
    })

    it('still distinguishes different style values', () => {
        const first = registry.add({ top: 3 }, true)
        const second = registry.add({ top: 5 }, true)

        expect(second.hash).not.toBe(first.hash)
    })
})
