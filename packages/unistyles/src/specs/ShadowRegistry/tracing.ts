const detail = { devtools: { track: 'Unistyles' } }
const canTrace = __DEV__ && typeof performance.measure === 'function'

// Slice on the "Unistyles" track of the React Native DevTools Performance panel, next to the native ones
export const traceSection = <T>(name: string, fn: () => T): T => {
    if (!canTrace) {
        return fn()
    }

    const start = performance.now()

    try {
        return fn()
    } finally {
        performance.measure(name, { start, end: performance.now(), detail })
    }
}
