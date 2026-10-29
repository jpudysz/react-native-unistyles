import { hyphenate, isServer } from '../utils'

type Styles = Map<string, any>
type StylesMap = Map<string, Map<string, Styles>>
type RuleParent = CSSStyleSheet | CSSGroupingRule
type Group = {
    rule: CSSGroupingRule
    // Mirrors rule.cssRules, so finding a rule doesn't create a CSSOM wrapper for every rule in the group
    rules: Array<CSSRule>
    classes: Map<string, { rule: CSSStyleRule; declarations: string }>
}

// Styles without a media query get a group too, so every group is an ordinary child list of one top level rule
const BASE_MEDIA_QUERY = '@media all'

export const getSelector = (className: string) => (className[0] === ':' ? className : `.${className}`)

export const getDeclarations = (styles: Styles) => {
    let declarations = ''

    for (const [propertyKey, value] of styles) {
        if (value === undefined) {
            continue
        }

        declarations += `${hyphenate(propertyKey)}:${value};`
    }

    return declarations
}

const insertRule = (parent: RuleParent, rule: string, index = parent.cssRules.length) => {
    try {
        return parent.cssRules[parent.insertRule(rule, index)]
    } catch {
        // The browser can't parse it, like another engine's vendor pseudo-element: a text sheet drops it too
        return undefined
    }
}

const indexOfRule = (parent: RuleParent, rule: CSSRule) => Array.prototype.indexOf.call(parent.cssRules, rule)

// Keeps the styles of CSSState in the style tag rule by rule: rewriting the tag's text reparsed the whole sheet and
// restyled every element on each change, while a rule edited through the CSSOM restyles only what its selector matches.
// Rules are only inserted, edited and deleted, never the text, so another runtime sharing the tag keeps its rules
export class CSSSheet {
    private tag: HTMLStyleElement | null = null
    private sheet: CSSStyleSheet | null = null
    // In the order of the styles map: the base group first, then media queries as they first appear
    private groups = new Map<string, Group | null>()
    private themes = new Map<string, { rule: CSSRule; css: string }>()
    // Server-rendered CSS stays until the first style change, which replaces it with the same styles
    private hasServerStyles = false

    constructor(
        private themesCSS: Map<string, string>,
        private styles: StylesMap,
    ) {
        if (isServer()) {
            return
        }

        const existingTag = document.getElementById('unistyles-web')

        if (existingTag) {
            this.tag = existingTag as HTMLStyleElement
            // A tag from another runtime has no text, its rules live in the CSSOM
            this.hasServerStyles = Boolean(this.tag.textContent)
            this.sheet = this.hasServerStyles ? null : this.tag.sheet

            return
        }

        this.tag = document.createElement('style')
        this.tag.id = 'unistyles-web'
        document.head.appendChild(this.tag)
        this.sheet = this.tag.sheet
    }

    syncClass = (mediaQuery: string, className: string) => {
        const sheet = this.getSheet()

        if (!sheet) {
            return
        }

        this.insertGroups(sheet)

        const group = this.groups.get(mediaQuery)

        if (group) {
            this.syncGroupClass(group, className, this.styles.get(mediaQuery)?.get(className))
        }
    }

    syncTheme = (key: string) => {
        // Theme variables come with the server styles, so they don't replace them
        const sheet = this.getSheet(false)
        const css = this.themesCSS.get(key)
        const current = this.themes.get(key)

        if (!sheet || css === undefined || current?.css === css) {
            return
        }

        const currentIndex = current ? indexOfRule(sheet, current.rule) : -1

        if (currentIndex >= 0) {
            sheet.deleteRule(currentIndex)
        }

        // An updated theme goes last, so it wins over the same theme another runtime on the tag registered later.
        // Theme rules only set variables, and on one element their specificity tells them apart, not their order
        const rule = insertRule(sheet, css)

        if (rule) {
            this.themes.set(key, { rule, css })

            return
        }

        this.themes.delete(key)
    }

    // Drops the style groups and keeps the themes, as CSSState keeps them on reset
    reset = () => {
        const sheet = this.tag?.sheet

        if (sheet && sheet === this.sheet) {
            this.deleteOwnRules(sheet, new Set(Array.from(this.groups.values(), (group) => group?.rule)))
        }

        this.groups.clear()
    }

    rebuild = () => {
        const sheet = this.tag?.sheet

        if (sheet && sheet === this.sheet) {
            this.deleteOwnRules(
                sheet,
                new Set([
                    ...Array.from(this.themes.values(), (theme) => theme.rule),
                    ...Array.from(this.groups.values(), (group) => group?.rule),
                ]),
            )
        }

        this.sheet = null
        this.getSheet()
    }

    private getSheet = (canReplaceServerStyles = true) => {
        if (!this.tag || (this.hasServerStyles && !canReplaceServerStyles)) {
            return null
        }

        if (!this.tag.isConnected) {
            document.head.appendChild(this.tag)
        }

        if (this.hasServerStyles) {
            this.hasServerStyles = false
            this.tag.textContent = ''
        }

        const sheet = this.tag.sheet

        // A new sheet lost every rule: the server one was replaced, or the tag was rewritten or attached again
        if (sheet && sheet !== this.sheet) {
            this.sheet = sheet
            this.insertAll(sheet)
        }

        return sheet
    }

    private insertAll = (sheet: CSSStyleSheet) => {
        this.groups.clear()
        this.themes.clear()
        this.themesCSS.forEach((_, key) => this.syncTheme(key))
        this.insertGroups(sheet)
        this.groups.forEach((group, mediaQuery) => {
            this.styles.get(mediaQuery)?.forEach((styles, className) => {
                if (group) {
                    this.syncGroupClass(group, className, styles)
                }
            })
        })
    }

    // Every group of the styles map gets created, empty ones too, so a group appended later is always the last one
    private insertGroups = (sheet: CSSStyleSheet) => {
        if (this.groups.size === this.styles.size) {
            return
        }

        this.styles.forEach((_, mediaQuery) => {
            if (this.groups.has(mediaQuery)) {
                return
            }

            const rule = insertRule(sheet, `${mediaQuery || BASE_MEDIA_QUERY}{}`) as CSSGroupingRule | undefined

            this.groups.set(mediaQuery, rule ? { rule, rules: [], classes: new Map() } : null)
        })
    }

    private syncGroupClass = (group: Group, className: string, styles?: Styles) => {
        const current = group.classes.get(className)

        if (!styles) {
            if (current) {
                const mirrorIndex = group.rules.indexOf(current.rule)
                const index =
                    group.rule.cssRules[mirrorIndex] === current.rule
                        ? mirrorIndex
                        : indexOfRule(group.rule, current.rule)

                if (index >= 0) {
                    group.rule.deleteRule(index)
                }

                if (mirrorIndex >= 0) {
                    group.rules.splice(mirrorIndex, 1)
                }

                group.classes.delete(className)
            }

            return
        }

        const declarations = getDeclarations(styles)

        if (current) {
            // Re-applied styles mostly come back the same, like on every resize event
            if (current.declarations !== declarations) {
                current.rule.style.cssText = declarations
                current.declarations = declarations
            }

            return
        }

        const rule = insertRule(group.rule, `${getSelector(className)}{${declarations}}`) as CSSStyleRule | undefined

        if (rule) {
            group.rules.push(rule)
            group.classes.set(className, { rule, declarations })
        }
    }

    private deleteOwnRules = (sheet: CSSStyleSheet, rules: Set<CSSRule | undefined>) => {
        for (let index = sheet.cssRules.length - 1; index >= 0; index--) {
            if (rules.has(sheet.cssRules[index])) {
                sheet.deleteRule(index)
            }
        }
    }
}
