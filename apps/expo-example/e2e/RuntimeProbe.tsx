import { useEffect, useRef } from 'react'
import { UnistylesRuntime, useUnistyles } from 'react-native-unistyles'
import { useE2EAction } from './actions'

// useUnistyles must re-render on runtime changes no StyleSheet depends on (#1254), like hasAdaptiveThemes
export const RuntimeProbe = () => {
    const { rt } = useUnistyles()
    const rendered = { hasAdaptiveThemes: rt.hasAdaptiveThemes, themeName: rt.themeName }
    const committed = useRef(rendered)

    useEffect(() => {
        committed.current = rendered
    })

    useE2EAction('runtime-probe.check', () => {
        const actual = committed.current
        const expected = { hasAdaptiveThemes: UnistylesRuntime.hasAdaptiveThemes, themeName: UnistylesRuntime.themeName }
        const prop = (Object.keys(expected) as Array<keyof typeof expected>).find(key => actual[key] !== expected[key])

        return prop
            ? { component: 'useUnistyles', prop, expected: String(expected[prop]), actual: String(actual[prop]) }
            : undefined
    })

    return null
}
