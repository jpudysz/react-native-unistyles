import type React from 'react'

let mockHasAdaptiveThemes = false
const mockReadRuntimeProps: Array<PropertyKey> = []

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => null,
}))
jest.mock('../core', () => ({
    useUnistyles: () => ({
        rt: new Proxy(
            {},
            {
                get: (_target, prop) => {
                    mockReadRuntimeProps.push(prop)

                    return prop === 'hasAdaptiveThemes' ? mockHasAdaptiveThemes : undefined
                },
            },
        ),
    }),
}))
jest.mock('../components/AdaptiveTheme', () => ({ AdaptiveTheme: () => null }))
jest.mock('../components/NamedTheme', () => ({ NamedTheme: () => null }))

const { ScopedTheme } = require('../components/ScopedTheme') as typeof import('../components/ScopedTheme')
const { AdaptiveTheme } = require('../components/AdaptiveTheme') as typeof import('../components/AdaptiveTheme')

type Element = React.ReactElement<React.PropsWithChildren>

// Renders ScopedTheme and the component it returns, the way React would on the next render
const render = (children: React.ReactNode) => {
    const scope = ScopedTheme({ invertedAdaptive: true, children }) as Element
    const component = scope.type as React.FunctionComponent<React.PropsWithChildren>

    return component(scope.props) as React.ReactNode
}

describe('ScopedTheme invertedAdaptive', () => {
    beforeEach(() => {
        mockHasAdaptiveThemes = false
        mockReadRuntimeProps.length = 0
    })

    it('reads adaptive themes through useUnistyles, so it re-renders when they are toggled', () => {
        render('child')

        expect(mockReadRuntimeProps).toContain('hasAdaptiveThemes')
    })

    it('follows adaptive themes turned on and off while mounted', () => {
        const children = 'child'

        expect(render(children)).toBe(children)

        mockHasAdaptiveThemes = true

        const inverted = render(children) as Element

        expect(inverted.type).toBe(AdaptiveTheme)
        expect(inverted.props.children).toBe(children)

        mockHasAdaptiveThemes = false

        expect(render(children)).toBe(children)
    })

    it('renders children as they are with invertedAdaptive={false}', () => {
        mockHasAdaptiveThemes = true

        expect(ScopedTheme({ invertedAdaptive: false, children: 'child' })).toBe('child')
    })
})
