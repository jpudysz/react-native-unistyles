import { getValueForBreakpoint, mq } from '../utils'
import type { NestedStyle } from '../types'
import { mockRuntime } from './mocks'

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

            const style = {
                [mq.width(null, 300)]: 'green',
                [mq.width(301)]: 'orange',
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

            const style = {
                [mq.width(null, 199)]: 'green',
                xs: 'pink'
            }

            expect(getValueForBreakpoint(style as NestedStyle)).toEqual('pink')
        })

        it('should fallback to orientation breakpoints on mobile if didn\'t match custom media query', () => {
            const { unistyles } = require('../core')

            unistyles.runtime = mockRuntime({
                width: 500,
                height: 1200
            })

            unistyles.runtime.sortedBreakpoints = []

            const style = {
                portrait: 'green',
                landscape: 'orange',
                md: 'pink'
            }

            expect(unistyles.runtime.breakpoint).toEqual('md')
            expect(getValueForBreakpoint(style as NestedStyle)).toEqual('green')
        })

        it('should return undefined if didn\'t match any media query, user has no breakpoints and it\'s not mobile', () => {
            const { unistyles } = require('../core')

            jest.requireMock('../common').isMobile = false

            unistyles.runtime = mockRuntime({
                width: 500,
                height: 1200
            })

            unistyles.runtime.sortedBreakpoints = []
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

            const style = {
                [mq.width(100, 300)]: 'center',
                sm: 'center',
                md: 'flex-start',
                xl: 'flex-end'
            }

            expect(unistyles.runtime.breakpoint).toEqual('lg')
            expect(getValueForBreakpoint(style as NestedStyle)).toEqual('flex-start')
        })
    })
})
