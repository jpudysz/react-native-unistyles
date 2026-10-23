// console.timeStamp(label, start, end, trackName), React Native 0.86+ reports it only while DevTools records and keeps
// nothing, unlike performance.measure, which adds every entry to an unbounded buffer
type TracingConsole = {
    timeStamp?: (label: string, start: number, end: number, trackName: string) => void
}

const tracingConsole = console as unknown as TracingConsole
const canTrace = __DEV__ && typeof tracingConsole.timeStamp === 'function'

// Slice on the "Unistyles" track of the React Native DevTools Performance panel, next to the native ones
export const traceSection = <T>(name: string, fn: () => T): T => {
    if (!canTrace) {
        return fn()
    }

    const start = performance.now()

    try {
        return fn()
    } finally {
        tracingConsole.timeStamp?.(name, start, performance.now(), 'Unistyles')
    }
}
