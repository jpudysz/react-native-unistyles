import { getValueForBreakpoint, mq } from '../utils'
import type { NestedStyle } from '../types'
import { mockRuntime, mockRegistry } from './mocks'

jest.mock('../core', () => {
    class MockedUnistyles {
        registry = {}
        runtime = {}
    }

    return {
        unistyles: new MockedUnistyles()
    }
})

jest.mock('../common', () => ({
    isMobile: true,
    ScreenOrientation: {
        Landscape: 'landscape',
        Portrait: 'portrait'
    }
}))

describe('breakpoints', () => {
    describe('getValueForBreakpoint', () => {
        afterEach(() => {
            jest.restoreAllMocks()
        })

        it('should prioritize custom media query', () => {
            const { unistyles } = require('../core')

            unistyles.runtime = mockRuntime({
                width: 500,
                height: 1200
            })
            unistyles.registry = mockRegistry()

            const style = {
                [mq.only.width(null, 300)]: 'green',
                [mq.only.width(301)]: 'orange',
                md: 'pink'
            }

            expect(unistyles.runtime.breakpoint).toEqual('md')
            expect(getValueForBreakpoint(style as NestedStyle)).toEqual('orange')
        })

        it('should fallback to breakpoints if didn\'t match any custom media query', () => {
            const { unistyles } = require('../core')

            unistyles.runtime = mockRuntime({
                width: 200,
                height: 750
            })
            unistyles.registry = mockRegistry()

            const style = {
                [mq.only.width(null, 199)]: 'green',
                xs: 'pink'
            }

            expect(getValueForBreakpoint(style as NestedStyle)).toEqual('pink')
        })

        it('should fallback to portrait on mobile if didn\'t match custom media query', () => {
            const { unistyles } = require('../core')

            unistyles.runtime = mockRuntime({
                width: 500,
                height: 1200
            })
            unistyles.registry = mockRegistry()
            unistyles.registry.sortedBreakpointPairs = []

            const style = {
                portrait: 'green',
                landscape: 'orange',
                md: 'pink'
            }

            expect(unistyles.runtime.orientation).toEqual('portrait')
            expect(getValueForBreakpoint(style as NestedStyle)).toEqual('green')
        })

        it('should fallback to landscape breakpoints on mobile if didn\'t match custom media query', () => {
            const { unistyles } = require('../core')

            unistyles.runtime = mockRuntime({
                width: 1200,
                height: 500
            })
            unistyles.registry = mockRegistry()
            unistyles.registry.sortedBreakpointPairs = []

            const style = {
                portrait: 'green',
                landscape: 'orange',
                md: 'pink'
            }

            expect(unistyles.runtime.orientation).toEqual('landscape')
            expect(getValueForBreakpoint(style as NestedStyle)).toEqual('orange')
        })

        it('should return undefined if didn\'t match any media query, user has no breakpoints and it\'s not mobile', () => {
            const { unistyles } = require('../core')

            jest.requireMock('../common').isMobile = false

            unistyles.runtime = mockRuntime({
                width: 500,
                height: 1200
            })
            unistyles.registry = mockRegistry()

            unistyles.runtime.breakpoint = ''

            const style = {
                portrait: 'green',
                landscape: 'orange',
                md: 'pink'
            }

            expect(getValueForBreakpoint(style as NestedStyle)).toEqual(undefined)
        })

        it('should return direct breakpoint value if matched', () => {
            const { unistyles } = require('../core')

            unistyles.runtime = mockRuntime({
                width: 400,
                height: 600
            })
            unistyles.registry = mockRegistry()

            const style = {
                sm: 100,
                md: 200,
                lg: 300
            }

            expect(getValueForBreakpoint(style as NestedStyle)).toEqual(100)
        })

        it('should return direct breakpoint value even if it\'s undefined', () => {
            const { unistyles } = require('../core')

            unistyles.runtime = mockRuntime({
                width: 800,
                height: 1200
            })
            unistyles.registry = mockRegistry()

            const style = {
                sm: 100,
                md: 200,
                lg: undefined
            }

            expect(getValueForBreakpoint(style as NestedStyle)).toEqual(undefined)
        })

        it('should match lower breakpoint to match css cascading', () => {
            const { unistyles } = require('../core')

            unistyles.runtime = mockRuntime({
                width: 990,
                height: 1200
            })
            unistyles.registry = mockRegistry()

            const style = {
                [mq.only.width(100, 300)]: 'center',
                sm: 'center',
                md: 'flex-start',
                xl: 'flex-end'
            }

            expect(unistyles.runtime.breakpoint).toEqual('lg')
            expect(getValueForBreakpoint(style as NestedStyle)).toEqual('flex-start')
        })
    })
})
