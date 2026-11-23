// Test only: rt.insets.top read three ways (a StyleSheet committed to the shadow tree, useUnistyles and UnistylesRuntime)
// while the status bar is hidden by every API an app may use. Below Android 11 each of them sets other window flags (#1384)
import React, { useEffect, useRef, useState } from 'react'
import { Platform, StatusBar, Text, View } from 'react-native'
import { SystemBars } from 'react-native-edge-to-edge'
import { StyleSheet, UnistylesRuntime, useUnistyles } from 'react-native-unistyles'
import { Button, Screen, Section } from '../components'
import { useE2EAction } from '../e2e/actions'
import { sleep } from '../e2e/settle'

// React Native's StatusBar, react-native-edge-to-edge's SystemBars, UnistylesRuntime.statusBar and immersive mode
const VARIANTS = ['rn', 'system-bars', 'unistyles', 'immersive'] as const

type Variant = typeof VARIANTS[number]
type ViewRef = React.ComponentRef<typeof View>

const INSETS_TIMEOUT_MS = 3000
const POLL_MS = 100
// the bar is laid out on the pixel grid
const TOLERANCE = 1

const setHidden: Record<Variant, (isHidden: boolean) => void> = {
    'rn': isHidden => StatusBar.setHidden(isHidden),
    'system-bars': isHidden => SystemBars.setHidden({ statusBar: isHidden }),
    'unistyles': isHidden => UnistylesRuntime.statusBar.setHidden(isHidden),
    'immersive': isHidden => UnistylesRuntime.setImmersiveMode(isHidden)
}

// The value useUnistyles rendered last, kept outside React state, reading it must not re-render
let hookTop: number | undefined

// Memoized, so only Unistyles changes them after the screen rendered
const HookReadout = React.memo(() => {
    const { rt } = useUnistyles()

    hookTop = rt.insets.top

    return <Text style={styles.readout}>{`useUnistyles top ${rt.insets.top}`}</Text>
})

const TopBar = React.memo<{ barRef: React.RefObject<ViewRef | null> }>(({ barRef }) => (
    <View ref={barRef} collapsable={false} style={styles.bar} />
))

const measureHeight = (view: ViewRef | null) => new Promise<number | undefined>(resolve => {
    if (!view) {
        resolve(undefined)

        return
    }

    view.measure((_x, _y, _width, height) => resolve(height))
})

const isClose = (value: number | undefined, expected: number) => value !== undefined && Math.abs(value - expected) <= TOLERANCE

export default function StatusBarScreen() {
    const bar = useRef<ViewRef | null>(null)
    // opened with the status bar shown
    const [shownTop] = useState(() => UnistylesRuntime.insets.top)
    const [hiddenBy, setHiddenBy] = useState<Variant | undefined>(undefined)
    const hiddenByRef = useRef<Variant | undefined>(undefined)

    const toggle = (variant: Variant, isHidden: boolean) => {
        hiddenByRef.current = isHidden ? variant : undefined
        setHidden[variant](isHidden)
        setHiddenBy(hiddenByRef.current)
    }

    // a failed run must not leave the status bar hidden for the next scenario
    useEffect(() => () => {
        if (hiddenByRef.current) {
            setHidden[hiddenByRef.current](false)
        }
    }, [])

    // Android has no status bar inset while it's hidden, an iPhone keeps its safe area below the notch
    const expectTop = async (isHidden: boolean) => {
        const deadline = Date.now() + INSETS_TIMEOUT_MS
        let values = { native: 0, styleSheet: undefined as number | undefined, hook: undefined as number | undefined }
        let expected = shownTop

        while (Date.now() < deadline) {
            values = {
                native: UnistylesRuntime.insets.top,
                styleSheet: await measureHeight(bar.current),
                hook: hookTop
            }
            expected = isHidden
                ? Platform.OS === 'android' ? 0 : values.native
                : shownTop

            const isShownTopKnown = isHidden || Platform.OS !== 'android' || shownTop > 0

            if (isShownTopKnown && isClose(values.native, expected) && isClose(values.styleSheet, expected) && isClose(values.hook, expected)) {
                return undefined
            }

            await sleep(POLL_MS)
        }

        return {
            styleKey: hiddenByRef.current ?? 'shown',
            prop: 'insets.top',
            expected: isHidden ? `${Platform.OS === 'android' ? '0' : 'the native value'} while hidden` : `${shownTop} (opened with the status bar shown)`,
            actual: `native ${values.native} StyleSheet ${values.styleSheet} useUnistyles ${values.hook}`
        }
    }

    useE2EAction('status-bar.hide', variant => toggle(variant as Variant, true))
    useE2EAction('status-bar.show', variant => toggle(variant as Variant, false))
    useE2EAction('status-bar.hidden', () => expectTop(true))
    useE2EAction('status-bar.shown', () => expectTop(false))

    return (
        <Screen>
            <Section title="Status bar" description={`The bar is as tall as rt.insets.top, hidden by ${hiddenBy ?? 'nothing'}`}>
                <HookReadout />
                <TopBar barRef={bar} />
                {VARIANTS.map(variant => (
                    <Button
                        key={variant}
                        title={`${hiddenBy === variant ? 'Show' : 'Hide'} with ${variant}`}
                        onPress={() => toggle(variant, hiddenBy !== variant)}
                    />
                ))}
            </Section>
        </Screen>
    )
}

const styles = StyleSheet.create((theme, rt) => ({
    readout: {
        fontSize: 13,
        color: theme.colors.muted
    },
    bar: {
        height: rt.insets.top,
        width: 8,
        borderRadius: 4,
        backgroundColor: theme.colors.accent
    }
}))
