import type { ScreenSize } from '../types'

const TEST_BREAKPOINTS = {
    xs: 0,
    sm: 300,
    md: 500,
    lg: 750,
    xl: 1000
} as const

export const mockRuntime = (screenSize: ScreenSize) => ({
    breakpoint: Object.entries(TEST_BREAKPOINTS)
        .reverse()
        .find(([, value]) => screenSize.width >= value)?.at(0),
    orientation: screenSize.width > screenSize.height
        ? 'landscape'
        : 'portrait',
    screen: screenSize
})

export const mockRegistry = () => ({
    sortedBreakpointPairs: Object.entries(TEST_BREAKPOINTS),
    plugins: []
})
