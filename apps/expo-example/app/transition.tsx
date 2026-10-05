// A Unistyles commit that lands while React yields in a transition render. React already cloned the bar with its new
// width, the commit must neither bring back the width the bar was linked with nor point React at the committed bar
import React, { startTransition, useEffect, useRef, useState } from 'react'
import { Text, View } from 'react-native'
import { StyleSheet, UnistylesRuntime } from 'react-native-unistyles'
import { Button, Screen, Section } from '../components'
import { useE2EAction } from '../e2e/actions'
import { THEME_NAMES, type ThemeName } from '../themes'

const WIDTHS = [120, 200]
const ITEMS = 12
// The item that interrupts the render, the bar before it is already complete, the section around both is not
const INTERRUPTING_ITEM = 4
const ITEM_RENDER_MS = 2

type Interruption = 'quiet' | 'flip'

let pendingInterruption: Interruption | undefined

// Runs inside a render, Unistyles applies it from a native callback the next time React yields
const interrupt = (interruption: Interruption) => {
    const current = UnistylesRuntime.themeName as ThemeName
    const other = THEME_NAMES.find(themeName => themeName !== current)!

    if (interruption === 'flip') {
        // every useUnistyles reading the theme re-renders, React restarts the transition
        UnistylesRuntime.setTheme(other)

        return
    }

    // a theme change no hook reads, like insets or the keyboard, React keeps the paused render
    UnistylesRuntime.updateTheme(other, theme => theme)
}

const busyWait = (ms: number) => {
    const end = performance.now() + ms

    while (performance.now() < end) {}
}

const Item: React.FunctionComponent<{ index: number, width: number }> = ({ index, width }) => {
    busyWait(ITEM_RENDER_MS)

    if (index === INTERRUPTING_ITEM && pendingInterruption) {
        const interruption = pendingInterruption

        pendingInterruption = undefined
        interrupt(interruption)
    }

    return <View style={[styles.item(index % 3), { width: width / 4 }]} />
}

const measureWidth = (view: View | null) => new Promise<number | undefined>(resolve => {
    if (!view) {
        resolve(undefined)

        return
    }

    view.measure((_x, _y, width) => resolve(width))
})

export default function TransitionScreen() {
    const [width, setWidth] = useState(WIDTHS[0]!)
    const committedWidth = useRef(width)
    const barRef = useRef<View>(null)

    useEffect(() => {
        committedWidth.current = width
    }, [width])

    const resize = async (interruption?: Interruption) => {
        const next = width === WIDTHS[0] ? WIDTHS[1]! : WIDTHS[0]!

        pendingInterruption = interruption
        startTransition(() => setWidth(next))

        const deadline = Date.now() + 3000

        while (committedWidth.current !== next) {
            if (Date.now() > deadline) {
                throw new Error(`The transition to width ${next} never committed`)
            }

            await new Promise(resolve => setTimeout(resolve, 16))
        }

        if (pendingInterruption) {
            pendingInterruption = undefined

            throw new Error('The transition rendered without the interrupting item')
        }
    }

    useE2EAction('transition.resize', interruption => resize(interruption as Interruption | undefined))
    // React owns the width, the committed bar must have the width React rendered last
    useE2EAction('transition.check', async () => {
        const actual = await measureWidth(barRef.current)

        return actual === committedWidth.current
            ? undefined
            : { styleKey: 'bar', prop: 'width', expected: String(committedWidth.current), actual: String(actual) }
    })

    return (
        <Screen>
            <Section title="Transition" description={`A Unistyles commit while React yields, bar width ${width}`}>
                <View ref={barRef} style={[styles.bar, { width }]} />
                {Array.from({ length: ITEMS }, (_, index) => (
                    <Item key={index} index={index} width={width} />
                ))}
            </Section>
            <Text style={styles.caption}>Resize starts a transition, a theme change lands while it renders</Text>
            <Button title="Resize" onPress={() => resize()} />
            <Button title="Resize, update another theme" onPress={() => resize('quiet')} />
            <Button title="Resize, change the theme" onPress={() => resize('flip')} />
        </Screen>
    )
}

const styles = StyleSheet.create(theme => ({
    bar: {
        height: 24,
        borderRadius: 6,
        backgroundColor: theme.colors.accent
    },
    item: (index: number) => ({
        height: 6,
        borderRadius: 3,
        backgroundColor: theme.colors.steps[index]
    }),
    caption: {
        fontSize: 13,
        color: theme.colors.muted
    }
}))
