// Test only: boxes mount once the breakpoint differs from the one the screen opened with (#1378). Their StyleSheets
// had no mounted node while the window changed, so only a refresh of the unmounted StyleSheet gives them the new value
import React, { useRef, useState } from 'react'
import { type LayoutChangeEvent, Text, View } from 'react-native'
import { StyleSheet, UnistylesRuntime, useUnistyles } from 'react-native-unistyles'
import { Screen, Section } from '../components'
import { useE2EAction } from '../e2e/actions'
import { breakpoints } from '../themes'

const PADDING = { xs: 10, md: 40, lg: 80 } as const

// New StyleSheets for every visit. Nodes of an earlier visit stay registered until Hermes collects them, and a window
// change rebuilds their (shared) unistyles, which would hide a StyleSheet that wasn't refreshed
const createBoxes = () => ({
    // StyleSheet.create(theme => ...), only a theme change refreshed it before #1378
    'theme =>': StyleSheet.create(theme => ({
        box: {
            paddingLeft: PADDING,
            backgroundColor: theme.colors.surface
        }
    })),
    '(theme, rt) =>': StyleSheet.create((theme, _rt) => ({
        box: {
            paddingLeft: PADDING,
            backgroundColor: theme.colors.surface
        }
    })),
    'static': StyleSheet.create({
        box: {
            paddingLeft: PADDING
        }
    })
})

type BoxName = keyof ReturnType<typeof createBoxes>

// the largest PADDING breakpoint at or below the current one
const expectedPadding = () => {
    const current = breakpoints[UnistylesRuntime.breakpoint as keyof typeof breakpoints]
    const key = (Object.keys(PADDING) as Array<keyof typeof PADDING>)
        .filter(name => breakpoints[name] <= current)
        .at(-1)!

    return PADDING[key]
}

export default function MountOnResizeScreen() {
    const { rt } = useUnistyles()
    const [openedAt] = useState(rt.breakpoint)
    const [boxes] = useState(createBoxes)
    // not React state, a measurement must not re-render the screen
    const paddings = useRef<Partial<Record<BoxName, number>>>({})
    const isMounted = rt.breakpoint !== openedAt
    const onLayout = (name: BoxName) => (event: LayoutChangeEvent) => {
        paddings.current[name] = event.nativeEvent.layout.x
    }

    useE2EAction('mount-on-resize.check', () => {
        if (!isMounted) {
            return { prop: 'breakpoint', expected: `other than ${openedAt}`, actual: UnistylesRuntime.breakpoint ?? '' }
        }

        const expected = expectedPadding()
        const name = (Object.keys(boxes) as Array<BoxName>)
            .find(box => Math.abs((paddings.current[box] ?? -1) - expected) > 1)

        return name
            ? {
                component: name,
                prop: `paddingLeft at ${UnistylesRuntime.breakpoint} (opened at ${openedAt})`,
                expected: String(expected),
                actual: String(paddings.current[name])
            }
            : undefined
    })

    return (
        <Screen>
            <Section title="Mounted after a resize" description={`opened at ${openedAt}, now ${rt.breakpoint}`}>
                {isMounted ? (Object.keys(boxes) as Array<BoxName>).map(name => (
                    <View key={name} style={boxes[name].box}>
                        <View onLayout={onLayout(name)} style={styles.marker}>
                            <Text style={styles.text}>{name}</Text>
                        </View>
                    </View>
                )) : <Text style={styles.text}>Rotate the device</Text>}
            </Section>
        </Screen>
    )
}

const styles = StyleSheet.create(theme => ({
    marker: {
        height: 24,
        backgroundColor: theme.colors.primary
    },
    text: {
        color: theme.colors.typography
    }
}))
