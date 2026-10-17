// Reanimated's AnimatedComponent keeps its own copy of the style for CSS transitions (#1007)
jest.mock('react-native-nitro-modules', () => {
    const changeListeners: Array<(dependencies: Array<number>) => void> = []

    return {
        changeListeners,
        NitroModules: {
            createHybridObject: () => ({
                init: () => {},
                addChangeListener: (listener: (dependencies: Array<number>) => void) => {
                    changeListeners.push(listener)

                    return () => {}
                },
                link: () => {},
                unlink: () => {},
                suspend: () => {},
                takeCommittedInstanceHandles: () => [],
                refreshReactNodes: () => {},
            }),
        },
    }
})

import { ScopedThemeContext } from '../components/ScopedThemeContext'
import { UnistylesShadowRegistry } from '../specs/ShadowRegistry'
import { Tag, chain, fiber, hostFiber, refOf, root, type TestFiber } from './fiberFixtures'

const shadowRegistry = UnistylesShadowRegistry as unknown as {
    add: (handle: object, styles: Array<unknown>) => void
    link: jest.Mock
    setScopedTheme: (name?: string) => void
    getScopedTheme: () => string | undefined
    takeCommittedInstanceHandles: jest.Mock
}

const { changeListeners } = jest.requireMock('react-native-nitro-modules') as {
    changeListeners: Array<(dependencies: Array<number>) => void>
}
const emitChange = () => changeListeners.forEach((listener) => listener([]))

const theme = { current: 'light', scoped: undefined as string | undefined }
const unistyle = {
    backgroundColor: 'light',
    unistyles_box: {
        uni__getStyles: () => ({ backgroundColor: theme.scoped === 'premium' ? 'black' : theme.current }),
    },
}

const flatten = (style: unknown): Record<string, unknown> =>
    Array.isArray(style) ? Object.assign({}, ...style.map(flatten)) : ((style as Record<string, unknown>) ?? {})

// Reanimated 4: the class renders its child with collapsable:false and keeps the child's ref as _componentRef
const animatedView = (style: Array<unknown>, hostProps: Record<string, unknown> = { collapsable: false }) => {
    const host = hostFiber({}, { ...hostProps, style })
    const owner: Record<string, any> = {
        props: { style },
        _componentRef: host.stateNode.canonical.publicInstance,
        _cssStyle: {},
        _CSSManager: { update: jest.fn() },
        _updateStyles(props: { style: unknown }) {
            const { unistyles_box: _, ...style } = flatten(props.style)

            this._cssStyle = { transitionProperty: ['backgroundColor'], ...style }
        },
        shouldComponentUpdate(nextProps: { style: unknown }) {
            this._updateStyles(nextProps)

            return true
        },
    }
    const animated = fiber(Tag.ClassComponent, { stateNode: owner })

    owner._reactInternals = animated
    owner._updateStyles(owner.props)
    chain(host, animated)

    return { host, owner, animated }
}

const link = (host: TestFiber, style: Array<unknown>) => shadowRegistry.add(refOf(host), style)

beforeEach(() => {
    theme.current = 'light'
    theme.scoped = undefined
    shadowRegistry.link = jest.fn()
    shadowRegistry.setScopedTheme = (name) => {
        theme.scoped = name
    }
    shadowRegistry.getScopedTheme = () => theme.scoped
})

describe('Reanimated CSS adapter', () => {
    it('updates the CSS manager with fresh theme values on change', () => {
        const style = [unistyle]
        const { host, owner, animated } = animatedView(style)

        chain(animated, root())
        link(host, style)
        theme.current = 'dark'
        shadowRegistry.takeCommittedInstanceHandles = jest.fn(() => [host])
        emitChange()

        expect(owner._CSSManager.update).toHaveBeenCalledTimes(1)
        expect(owner._CSSManager.update.mock.calls[0][0].backgroundColor).toBe('dark')
    })

    it('keeps inline styles after unistyles in style order', () => {
        const style = [unistyle, { backgroundColor: 'red' }]
        const { host, owner, animated } = animatedView(style)

        chain(animated, root())
        link(host, style)
        theme.current = 'dark'
        shadowRegistry.takeCommittedInstanceHandles = jest.fn(() => [host])
        emitChange()

        expect(owner._CSSManager.update.mock.calls[0][0].backgroundColor).toBe('red')
    })

    it('resolves scoped styles inside ScopedTheme and restores the scope', () => {
        const style = [unistyle]
        const { host, owner, animated } = animatedView(style)
        const provider = fiber(Tag.ContextProvider, {
            type: ScopedThemeContext,
            memoizedProps: { value: { name: 'premium' } },
        })

        chain(animated, provider, root())
        link(host, style)
        shadowRegistry.takeCommittedInstanceHandles = jest.fn(() => [host])
        emitChange()

        expect(owner._CSSManager.update.mock.calls[0][0].backgroundColor).toBe('black')
        expect(theme.scoped).toBeUndefined()
    })

    it('resolves scoped styles during render, before any theme change', () => {
        const style = [unistyle]
        const { host, owner, animated } = animatedView(style)
        const context = ScopedThemeContext as unknown as { _currentValue2: unknown }

        chain(animated, root())
        link(host, style)
        context._currentValue2 = { name: 'premium' }

        try {
            owner.shouldComponentUpdate({ style })
        } finally {
            context._currentValue2 = null
        }

        expect(owner._cssStyle.backgroundColor).toBe('black')
    })

    it('does not touch views without collapsable:false', () => {
        const style = [unistyle]
        const { host, owner, animated } = animatedView(style, {})
        const original = owner._updateStyles

        chain(animated, root())
        link(host, style)
        shadowRegistry.takeCommittedInstanceHandles = jest.fn(() => [host])
        emitChange()

        expect(owner._updateStyles).toBe(original)
        expect(owner._CSSManager.update).not.toHaveBeenCalled()
    })

    // a frozen screen: React ran componentWillUnmount when hiding, Reanimated keeps transitions until the reveal
    const hiddenAnimatedView = (style: Array<unknown>) => {
        const view = animatedView(style)

        chain(view.animated, fiber(Tag.Offscreen, { memoizedState: {} }), fiber(Tag.Activity), root())
        view.owner._willUnmount = true

        return view
    }

    it('refreshes hidden owners with transitions only', () => {
        const style = [unistyle]
        const { host, owner } = hiddenAnimatedView(style)

        link(host, style)
        theme.current = 'dark'
        shadowRegistry.takeCommittedInstanceHandles = jest.fn(() => [host])
        emitChange()

        expect(owner._CSSManager.update).toHaveBeenCalledTimes(1)
        expect(owner._CSSManager.update.mock.calls[0][0].backgroundColor).toBe('dark')
    })

    it('skips hidden owners with keyframe animations', () => {
        const style = [
            unistyle,
            { animationName: { from: { opacity: 0 }, to: { opacity: 1 } }, animationDuration: 1000 },
        ]
        const { host, owner } = hiddenAnimatedView(style)

        link(host, style)
        shadowRegistry.takeCommittedInstanceHandles = jest.fn(() => [host])
        emitChange()

        expect(owner._CSSManager.update).not.toHaveBeenCalled()
    })

    it('skips hidden owners with pseudo-style values', () => {
        const style = [unistyle, { opacity: { default: 1, ':pressed': 0.5 } }]
        const { host, owner } = hiddenAnimatedView(style)

        link(host, style)
        shadowRegistry.takeCommittedInstanceHandles = jest.fn(() => [host])
        emitChange()

        expect(owner._CSSManager.update).not.toHaveBeenCalled()
    })

    it('keeps rendering when a unistyle is no longer registered', () => {
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
        const gone = {
            backgroundColor: 'light',
            unistyles_gone: {
                uni__getStyles: () => {
                    throw new Error('Unistyles: Style is no longer registered!')
                },
            },
        }
        const style = [gone]
        const { host, owner, animated } = animatedView(style)

        chain(animated, root())
        link(host, style)

        expect(() => owner.shouldComponentUpdate({ style })).not.toThrow()
        expect(owner._cssStyle.backgroundColor).toBe('light')

        warn.mockRestore()
    })

    // the adapter is switched off for the rest of this file after this test
    it('warns once and keeps linking when the adapter throws', () => {
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
        const style = [unistyle]
        const { host, owner, animated } = animatedView(style)

        chain(animated, root())
        owner._CSSManager.update = () => {
            throw new Error('Reanimated changed')
        }
        link(host, style)
        shadowRegistry.takeCommittedInstanceHandles = jest.fn(() => [host])
        emitChange()
        emitChange()
        link(host, style)

        expect(warn).toHaveBeenCalledTimes(1)
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('Unistyles'))
        expect(shadowRegistry.link).toHaveBeenCalledTimes(2)

        warn.mockRestore()
    })
})
