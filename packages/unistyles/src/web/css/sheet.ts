import { hyphenate, isServer } from '../utils'

type Styles = Map<string, any>
type StylesMap = Map<string, Map<string, Styles>>
type RuleParent = CSSStyleSheet | CSSGroupingRule
type Group = {
    rule: CSSGroupingRule
    rules: Array<CSSRule>
    classes: Map<string, { rule: CSSStyleRule; declarations: string }>
    rejected: Map<string, string>
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
        // The browser can't parse it, like a pseudo-element it doesn't support yet: a text sheet drops it too
        return undefined
    }
}

const indexOfRule = (parent: RuleParent, rule: CSSRule) => Array.prototype.indexOf.call(parent.cssRules, rule)

// Keeps the styles of CSSState in the style tag through the CSSOM, never its text, so another runtime keeps its rules
export class CSSSheet {
    private tag: HTMLStyleElement | null = null
    private sheet: CSSStyleSheet | null = null
    private groups = new Map<string, Group | null>()
    private themes = new Map<string, CSSRule>()
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

    refresh = () => {
        const sheet = this.getSheet()

        if (sheet) {
            this.insertGroups(sheet)
        }
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

    // False only when the browser rejects the theme, so CSSState keeps the CSS that is applied
    syncTheme = (key: string, css = this.themesCSS.get(key)) => {
        const sheet = this.getThemeSheet()
        const current = this.themes.get(key)

        if (!sheet || css === undefined) {
            return true
        }

        // The theme goes last on every update, so it wins over the same theme of a runtime added to the tag later
        const rule = insertRule(sheet, css)

        // Inserted before the old rule goes, so a theme the browser rejects keeps the previous variables
        if (!rule) {
            return false
        }

        const currentIndex = current ? indexOfRule(sheet, current) : -1

        if (currentIndex >= 0) {
            sheet.deleteRule(currentIndex)
        }

        this.themes.set(key, rule)

        return true
    }

    reset = () => {
        const sheet = this.tag?.sheet

        if (sheet && sheet === this.sheet) {
            this.deleteOwnRules(sheet, new Set(Array.from(this.groups.values(), (group) => group?.rule)))
        }

        this.groups.clear()
    }

    private getSheet = () => {
        if (!this.tag) {
            return null
        }

        if (!this.tag.isConnected) {
            document.head.appendChild(this.tag)
        }

        // Another runtime on the tag may have cleared the server text and filled the tag through the CSSOM already
        if (this.hasServerStyles) {
            this.hasServerStyles = false

            if (this.tag.textContent) {
                this.tag.textContent = ''
            }
        }

        const sheet = this.tag.sheet

        // A new sheet lost every rule: the server one was replaced, or the tag was rewritten or attached again
        if (sheet && sheet !== this.sheet) {
            this.sheet = sheet
            this.insertAll(sheet)
        }

        return sheet
    }

    private getThemeSheet = () => {
        if (this.hasServerStyles) {
            return this.tag?.sheet ?? null
        }

        return this.getSheet()
    }

    private insertAll = (sheet: CSSStyleSheet) => {
        this.groups.clear()
        // A theme added on top of server styles another runtime already replaced is still in this sheet
        this.deleteOwnRules(sheet, new Set(this.themes.values()))
        this.themes.clear()
        this.themesCSS.forEach((_, key) => this.syncTheme(key))
        this.insertGroups(sheet)
        this.groups.forEach((group, mediaQuery) => {
            if (!group) {
                return
            }

            this.styles.get(mediaQuery)?.forEach((styles, className) => this.syncGroupClass(group, className, styles))
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

            this.groups.set(mediaQuery, rule ? { rule, rules: [], classes: new Map(), rejected: new Map() } : null)
        })
    }

    private syncGroupClass = (group: Group, className: string, styles?: Styles) => {
        const current = group.classes.get(className)

        if (!styles) {
            group.rejected.delete(className)

            if (current) {
                const index = group.rules.indexOf(current.rule)

                group.rule.deleteRule(index)
                group.rules.splice(index, 1)
                group.classes.delete(className)
            }

            return
        }

        const declarations = getDeclarations(styles)

        if (current) {
            if (current.declarations !== declarations) {
                current.rule.style.cssText = declarations
                current.declarations = declarations
            }

            return
        }

        if (group.rejected.get(className) === declarations) {
            return
        }

        const rule = insertRule(group.rule, `${getSelector(className)}{${declarations}}`) as CSSStyleRule | undefined

        if (rule) {
            group.rules.push(rule)
            group.classes.set(className, { rule, declarations })
            group.rejected.delete(className)

            return
        }

        group.rejected.set(className, declarations)
    }

    private deleteOwnRules = (sheet: CSSStyleSheet, rules: Set<CSSRule | undefined>) => {
        for (let index = sheet.cssRules.length - 1; index >= 0; index--) {
            if (rules.has(sheet.cssRules[index])) {
                sheet.deleteRule(index)
            }
        }
    }
}
