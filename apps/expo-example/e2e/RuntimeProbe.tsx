import { type ComponentRef, useEffect, useRef } from 'react'
import { I18nManager, View } from 'react-native'
import { StyleSheet, UnistylesRuntime, useUnistyles } from 'react-native-unistyles'
import { useE2EAction } from './actions'

type ViewRef = ComponentRef<typeof View>

const measureWidth = (view: ViewRef | null) => new Promise<number | undefined>(resolve => {
    if (!view) {
        resolve(undefined)

        return
    }

    view.measure((_x, _y, width) => resolve(width))
})

// useUnistyles must re-render on runtime changes no StyleSheet depends on (#1254), like hasAdaptiveThemes
export const RuntimeProbe = () => {
    const { rt } = useUnistyles()
    const rendered = { hasAdaptiveThemes: rt.hasAdaptiveThemes, themeName: rt.themeName, rtl: rt.rtl }
    const committed = useRef(rendered)
    const rtlBar = useRef<ViewRef | null>(null)

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

    // rt.rtl follows React Native's rule (forceRTL, allowRTL, supportsRtl on Android and the locale)
    useE2EAction('runtime-probe.rtl', async () => {
        const values = {
            native: UnistylesRuntime.rtl,
            styleSheet: await measureWidth(rtlBar.current) === 2,
            hook: committed.current.rtl
        }
        const isAgreed = Object.values(values).every(value => value === I18nManager.isRTL)

        return isAgreed
            ? undefined
            : {
                component: 'rt',
                prop: 'rtl',
                expected: `I18nManager.isRTL ${I18nManager.isRTL}`,
                actual: `native ${values.native} StyleSheet ${values.styleSheet} useUnistyles ${values.hook}`
            }
    })

    return <View ref={rtlBar} collapsable={false} pointerEvents="none" style={styles.rtlBar} />
}

const styles = StyleSheet.create((_theme, rt) => ({
    rtlBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        height: 1,
        width: rt.rtl ? 2 : 1,
        opacity: 0
    }
}))
