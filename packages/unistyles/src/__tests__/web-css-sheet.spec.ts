import { CSSState } from '../web/css/state'

type DOM = { window: Window & typeof globalThis }

// The React Native preset can't run in the jsdom environment, so the tests bring their own document
const { JSDOM } = jest.requireActual('jsdom') as { JSDOM: new () => DOM }

jest.mock('../web/services', () => ({
    services: {
        runtime: {
            breakpoints: { xs: 0, md: 768 },
        },
    },
}))

let dom: DOM

const createState = () => new CSSState({ runtime: {} } as never)
// Pseudo-classes and breakpoints aren't part of the native style types
const add = (state: CSSState, hash: string, values: Record<string, unknown>) => state.add(hash, values as never)
const getTag = () => document.getElementById('unistyles-web') as HTMLStyleElement
const getSheet = () => getTag().sheet as CSSStyleSheet
const getGroup = (index: number) => getSheet().cssRules[index] as CSSMediaRule
const describeRule = (rule: CSSRule): string => {
    if (rule instanceof dom.window.CSSStyleRule) {
        return `${rule.selectorText}{${rule.style.cssText}}`
    }

    if (rule instanceof dom.window.CSSMediaRule) {
        return `@media ${rule.media.mediaText}{${Array.from(rule.cssRules, describeRule).join('')}}`
    }

    return rule.cssText
}
// Browsers serialize rules their own way, so the tests read what each rule holds
const describeSheet = () => Array.from(getSheet().cssRules, describeRule)

beforeEach(() => {
    dom = new JSDOM()
    globalThis.document = dom.window.document
})

afterAll(() => {
    // @ts-expect-error the node environment has no document
    delete globalThis.document
})

describe('Web CSS sheet', () => {
    it('writes styles as rules and leaves the tag text empty', () => {
        const state = createState()

        add(state, 'hash', { color: 'red' })

        expect(getTag().textContent).toBe('')
        expect(describeSheet()).toEqual(['@media all{.hash{color: red;}}'])
    })

    it('puts the base group before media queries even when a media query comes first', () => {
        const state = createState()

        add(state, 'first', { width: { xs: 100, md: 200 } })
        add(state, 'second', { width: 50 })

        expect(describeSheet()).toEqual([
            '@media all{.second{width: 50px;}}',
            '@media (min-width: 0px) and (max-width: 767.98px){.first{width: 100px;}}',
            '@media (min-width: 768px){.first{width: 200px;}}',
        ])
        expect(state.getStyles()).toBe(
            '.second{width:50px;}@media (min-width: 0px) and (max-width: 767.98px){.first{width:100px;}}@media (min-width: 768px){.first{width:200px;}}',
        )
    })

    it('edits the rule of a re-applied style in place and drops what the style no longer has', () => {
        const state = createState()

        add(state, 'hash', { color: 'red', _hover: { color: 'blue' } })

        const rule = getGroup(0).cssRules[0]

        add(state, 'hash', { color: 'green' })

        expect(getGroup(0).cssRules[0]).toBe(rule)
        expect(describeSheet()).toEqual(['@media all{.hash{color: green;}}'])
        expect(state.getStyles()).toBe('.hash{color:green;}')
    })

    it('keeps the previous declarations when a re-applied style fails to convert', () => {
        const state = createState()

        add(state, 'hash', { color: 'red', _hover: { color: 'blue' } })

        expect(() =>
            add(state, 'hash', {
                get color() {
                    throw new Error('conversion failed')
                },
            }),
        ).toThrow('conversion failed')
        expect(state.getStyles()).toBe('.hash{color:red;}.hash:hover{color:blue;}')
        expect(describeSheet()).toEqual(['@media all{.hash{color: red;}.hash:hover{color: blue;}}'])
    })

    it('leaves the sheet alone when a style is re-applied with the same values', () => {
        const state = createState()

        add(state, 'hash', { color: 'red', _hover: { color: 'blue' } })

        const group = getGroup(0)
        const rule = group.cssRules[0] as CSSStyleRule
        const insertRule = jest.spyOn(group, 'insertRule')
        const deleteRule = jest.spyOn(group, 'deleteRule')
        const setCSSText = jest.spyOn(rule.style, 'cssText', 'set')

        add(state, 'hash', { color: 'red', _hover: { color: 'blue' } })

        expect(insertRule).not.toHaveBeenCalled()
        expect(deleteRule).not.toHaveBeenCalled()
        expect(setCSSText).not.toHaveBeenCalled()
    })

    it('keeps the order of the other rules in a group when a style is re-applied', () => {
        const state = createState()

        add(state, 'parent_child > *', { color: 'red' })
        add(state, 'child', { color: 'blue' })
        add(state, 'parent_child > *', { color: 'green' })

        expect(describeSheet()).toEqual(['@media all{.parent_child > *{color: green;}.child{color: blue;}}'])
    })

    it('removes the pseudo and children rules together with the style', () => {
        const state = createState()

        add(state, 'hash', { color: 'red', _hover: { color: 'blue' }, pointerEvents: 'box-none' })
        add(state, 'other', { color: 'black' })
        state.remove('hash')

        expect(describeSheet()).toEqual(['@media all{.other{color: black;}}'])
        expect(state.getStyles()).toBe('.other{color:black;}')
    })

    it('removes the pseudo, children and media query rules of a hydrated style', () => {
        const state = createState()

        state.hydrate({
            mainState: [
                [
                    '',
                    [
                        ['hash', [['color', 'red']]],
                        ['hash:hover', [['color', 'blue']]],
                        [':where(.hash)>*', [['pointer-events', 'auto']]],
                        ['other', [['color', 'black']]],
                    ],
                ],
                ['@media (min-width: 768px)', [['hash', [['color', 'green']]]]],
            ],
            mqState: [],
            config: {} as never,
        })
        state.remove('hash')

        expect(describeSheet()).toEqual(['@media all{.other{color: black;}}', '@media (min-width: 768px){}'])
        expect(state.getStyles()).toBe('.other{color:black;}@media (min-width: 768px){}')
    })

    it('replaces a hydrated style when it is re-applied', () => {
        const state = createState()

        state.hydrate({
            mainState: [
                [
                    '',
                    [
                        ['hash', [['color', 'red']]],
                        ['hash:hover', [['color', 'blue']]],
                    ],
                ],
            ],
            mqState: [],
            config: {} as never,
        })
        add(state, 'hash', { color: 'green' })

        expect(describeSheet()).toEqual(['@media all{.hash{color: green;}}'])
        expect(state.getStyles()).toBe('.hash{color:green;}')
    })

    it('keeps the styles of a forChild hash when its class name is removed', () => {
        const state = createState()

        // The registry caches forChild styles under the whole hash and removes the class name, so removing them
        // here would leave a cached hash without styles
        state.hydrate({
            mainState: [
                [
                    '',
                    [
                        ['server_child > *', [['color', 'red']]],
                        ['server_child > *:hover', [['color', 'blue']]],
                    ],
                ],
            ],
            mqState: [],
            config: {} as never,
        })
        add(state, 'parent_child > *', { color: 'red', _hover: { color: 'blue' } })
        state.remove('server_child')
        state.remove('parent_child')

        expect(describeSheet()).toEqual([
            '@media all{.server_child > *{color: red;}.server_child > *:hover{color: blue;}.parent_child > *{color: red;}.parent_child > *:hover{color: blue;}}',
        ])
    })

    it('updates a theme without touching the styles', () => {
        const state = createState()

        state.addTheme('light', { colors: { background: '#ffffff' } })
        add(state, 'hash', { color: 'red' })

        const group = getGroup(2)

        state.addTheme('light', { colors: { background: '#000000' } })

        expect(getGroup(0)).toBe(group)
        expect(describeSheet()).toEqual([
            '@media all{.hash{color: red;}}',
            '@media (prefers-color-scheme: light){:root,[data-unistyles-reset]{--colors-background: #000000;}}',
            ':root.light,:root.light [data-unistyles-reset],[data-unistyles-theme="light"]{--colors-background: #000000;}',
        ])
    })

    it('puts an updated theme after the same theme of another runtime sharing the tag', () => {
        const host = createState()

        host.addTheme('premium', { colors: { background: '#ff9ff3' } })

        const widget = createState()

        widget.addTheme('premium', { colors: { background: '#ff9ff3' } })
        host.addTheme('premium', { colors: { background: '#000000' } })

        expect(describeSheet()).toEqual([
            ':root.premium,:root.premium [data-unistyles-reset],[data-unistyles-theme="premium"]{--colors-background: #ff9ff3;}',
            ':root.premium,:root.premium [data-unistyles-reset],[data-unistyles-theme="premium"]{--colors-background: #000000;}',
        ])
    })

    it('puts a theme updated with the same values after the same theme of another runtime again', () => {
        const host = createState()

        host.addTheme('premium', { colors: { background: '#000000' } })

        const widget = createState()

        widget.addTheme('premium', { colors: { background: '#ff9ff3' } })
        host.addTheme('premium', { colors: { background: '#000000' } })

        expect(describeSheet()).toEqual([
            ':root.premium,:root.premium [data-unistyles-reset],[data-unistyles-theme="premium"]{--colors-background: #ff9ff3;}',
            ':root.premium,:root.premium [data-unistyles-reset],[data-unistyles-theme="premium"]{--colors-background: #000000;}',
        ])
    })

    it('keeps the rules of another runtime sharing the tag', () => {
        const host = createState()

        add(host, 'host', { color: 'red' })

        const widget = createState()

        add(widget, 'widget', { color: 'blue' })
        widget.remove('widget')
        widget.reset()
        add(host, 'later', { color: 'green' })

        expect(document.querySelectorAll('#unistyles-web')).toHaveLength(1)
        expect(describeSheet()).toEqual(['@media all{.host{color: red;}.later{color: green;}}'])
    })

    it('brings its rules back when the tag text is rewritten', () => {
        const state = createState()

        add(state, 'first', { color: 'red' })
        getTag().textContent = '.foreign{color:blue}'
        add(state, 'second', { color: 'green' })

        expect(describeSheet()).toEqual([
            '.foreign{color: blue;}',
            '@media all{.first{color: red;}.second{color: green;}}',
        ])
    })

    it('brings its rules back when the tag text is rewritten and a change syncs no class', () => {
        const state = createState()

        add(state, 'first', { color: 'red' })
        getTag().textContent = '.foreign{color:blue}'
        state.remove('unknown')

        expect(describeSheet()).toEqual(['.foreign{color: blue;}', '@media all{.first{color: red;}}'])

        getTag().textContent = '.foreign{color:blue}'
        add(state, 'empty', {})

        expect(describeSheet()).toEqual(['.foreign{color: blue;}', '@media all{.first{color: red;}}'])
    })

    it('refreshes the sheet only for a change that syncs no class', () => {
        const state = createState()
        const refresh = jest.spyOn(state['sheet'], 'refresh')

        add(state, 'hash', { color: 'red' })
        add(state, 'hash', { color: 'green' })
        state.remove('hash')

        expect(refresh).not.toHaveBeenCalled()

        state.remove('hash')
        add(state, 'empty', {})

        expect(refresh).toHaveBeenCalledTimes(2)
    })

    it('keeps server styles until the first style change and replaces them with the same styles', () => {
        document.head.innerHTML = '<style id="unistyles-web">.hash{color:red;}</style>'

        const state = createState()

        state.addTheme('premium', { colors: { background: '#ff9ff3' } })

        expect(getTag().textContent).toBe('.hash{color:red;}')

        state.hydrate({ mainState: [['', [['hash', [['color', 'red']]]]]], mqState: [], config: {} as never })

        expect(getTag().textContent).toBe('')
        expect(describeSheet()).toEqual([
            ':root.premium,:root.premium [data-unistyles-reset],[data-unistyles-theme="premium"]{--colors-background: #ff9ff3;}',
            '@media all{.hash{color: red;}}',
        ])
    })

    it('applies a theme update on top of the server styles until hydration', () => {
        document.head.innerHTML = '<style id="unistyles-web">.hash{color:red;}</style>'

        const state = createState()
        const theme = (background: string) =>
            `:root.premium,:root.premium [data-unistyles-reset],[data-unistyles-theme="premium"]{--colors-background: ${background};}`

        state.addTheme('premium', { colors: { background: '#ff9ff3' } })
        state.addTheme('premium', { colors: { background: '#000000' } })

        expect(getTag().textContent).toBe('.hash{color:red;}')
        expect(describeSheet()).toEqual(['.hash{color: red;}', theme('#000000')])

        state.hydrate({ mainState: [['', [['hash', [['color', 'red']]]]]], mqState: [], config: {} as never })

        expect(getTag().textContent).toBe('')
        expect(describeSheet()).toEqual([theme('#000000'), '@media all{.hash{color: red;}}'])
    })

    it('hydrates media query styles sent apart into the same groups', () => {
        const state = createState()

        state.hydrate({
            mainState: [['', [['hash', [['color', 'red']]]]]],
            mqState: [['@media (min-width: 768px)', [['hash', [['color', 'blue']]]]]],
            config: {} as never,
        })

        expect(describeSheet()).toEqual([
            '@media all{.hash{color: red;}}',
            '@media (min-width: 768px){.hash{color: blue;}}',
        ])
    })

    it('skips a rule the browser rejects and applies the rest', () => {
        const state = createState()

        add(state, 'first', { color: 'red' })
        jest.spyOn(getGroup(0), 'insertRule').mockImplementationOnce(() => {
            throw new SyntaxError('unsupported selector')
        })
        add(state, 'rejected', { color: 'blue' })
        add(state, 'last', { color: 'green' })
        state.remove('first')

        expect(describeSheet()).toEqual(['@media all{.last{color: green;}}'])
        expect(state.getStyles()).toBe('.rejected{color:blue;}.last{color:green;}')
    })

    it("doesn't insert a rejected rule again until its style is removed", () => {
        const state = createState()

        add(state, 'other', { color: 'black' })

        const group = getGroup(0)
        const insertGroupRule = group.insertRule.bind(group)
        const insertRule = jest.spyOn(group, 'insertRule').mockImplementation((rule, index) => {
            if (rule.startsWith('.hash::incorrect-pseudo')) {
                throw new SyntaxError('unsupported selector')
            }

            return insertGroupRule(rule, index)
        })
        const getRejectedInserts = () =>
            insertRule.mock.calls.filter(([rule]) => rule.startsWith('.hash::incorrect-pseudo')).length
        // Hydration takes class names as they come, and useServerUnistyles hydrates on every render
        const hydrate = () =>
            state.hydrate({
                mainState: [
                    [
                        '',
                        [
                            ['hash', [['color', 'red']]],
                            ['hash::incorrect-pseudo', [['display', 'none']]],
                        ],
                    ],
                ],
                mqState: [],
                config: {} as never,
            })

        hydrate()
        hydrate()

        expect(getRejectedInserts()).toBe(1)

        state.remove('hash')
        hydrate()

        expect(getRejectedInserts()).toBe(2)
        expect(describeSheet()).toEqual(['@media all{.other{color: black;}.hash{color: red;}}'])
    })
})
