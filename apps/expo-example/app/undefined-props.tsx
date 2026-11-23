// Test only: styles that set a prop in light and leave it undefined in the other themes. React resets a prop whose
// style value is undefined, a theme change has to reset it too, also on a kept element that mounts after the change
import React, { useMemo, useRef, useState } from 'react'
import { Text, View } from 'react-native'
import { StyleSheet, UnistylesRuntime } from 'react-native-unistyles'
import { Screen, Section } from '../components'
import { useE2EAction } from '../e2e/actions'

const WIDTH = 200
const CONTENT_WIDTH = 40

const BOXES = ['object', 'dynamic', 'variant', 'kept'] as const

type BoxName = typeof BOXES[number]
type BoxRefs = Record<BoxName, React.RefObject<React.ComponentRef<typeof View> | null>>

const measureWidth = (ref: BoxRefs[BoxName]) => new Promise<number | undefined>(resolve => {
    if (!ref.current) {
        resolve(undefined)

        return
    }

    ref.current.measure((_x, _y, width) => resolve(width))
})

const Row: React.FunctionComponent<React.PropsWithChildren<{ label: string }>> = ({ label, children }) => (
    <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        {children}
    </View>
)

// Memoized, so only Unistyles can change these boxes, a React render would reset the props by itself
const MountedBoxes = React.memo(({ refs }: { refs: BoxRefs }) => {
    const variantStyles = styles.useVariants({ size: 'wide' })

    return (
        <React.Fragment>
            <Row label="object">
                <View ref={refs.object} style={styles.box}>
                    <View style={styles.content} />
                </View>
            </Row>
            <Row label="dynamic function">
                <View ref={refs.dynamic} style={styles.dynamicBox(WIDTH)}>
                    <View style={styles.content} />
                </View>
            </Row>
            <Row label="variant">
                <View ref={refs.variant} style={variantStyles.variantBox}>
                    <View style={styles.content} />
                </View>
            </Row>
        </React.Fragment>
    )
})

export default function UndefinedPropsScreen() {
    const [isKeptMounted, setIsKeptMounted] = useState(false)
    const objectRef = useRef<React.ComponentRef<typeof View>>(null)
    const dynamicRef = useRef<React.ComponentRef<typeof View>>(null)
    const variantRef = useRef<React.ComponentRef<typeof View>>(null)
    const keptRef = useRef<React.ComponentRef<typeof View>>(null)
    const [refs] = useState<BoxRefs>(() => ({ object: objectRef, dynamic: dynamicRef, variant: variantRef, kept: keptRef }))
    // made in the theme the screen opened with and mounted later, like an element kept by the React Compiler (#1386)
    const keptBox = useMemo(() => (
        <View ref={keptRef} style={styles.box}>
            <View style={styles.content} />
        </View>
    ), [])

    useE2EAction('undefined-props.mount-kept', () => setIsKeptMounted(true))
    useE2EAction('undefined-props.check', async () => {
        const themeName = UnistylesRuntime.themeName
        const expected = themeName === 'light' ? WIDTH : CONTENT_WIDTH
        const wrongWidths: Array<string> = []

        for (const name of BOXES) {
            if (name === 'kept' && !isKeptMounted) {
                continue
            }

            const width = await measureWidth(refs[name])

            if (width === undefined || Math.abs(width - expected) > 1) {
                wrongWidths.push(`${name} ${width}`)
            }
        }

        return wrongWidths.length > 0
            ? {
                prop: `width in ${themeName} (undefined outside light)`,
                expected: String(expected),
                actual: wrongWidths.join(', ')
            }
            : undefined
    })

    return (
        <Screen>
            <Section title="Undefined outside light" description={`width ${WIDTH} and an accent background in light, undefined in the other themes`}>
                <MountedBoxes refs={refs} />
                <Row label="kept">
                    {isKeptMounted ? keptBox : null}
                </Row>
            </Section>
        </Screen>
    )
}

const styles = StyleSheet.create((theme, rt) => ({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.gap(1),
        minHeight: 24
    },
    label: {
        width: 120,
        color: theme.colors.typography
    },
    content: {
        width: CONTENT_WIDTH,
        height: 24
    },
    box: {
        width: rt.themeName === 'light' ? WIDTH : undefined,
        backgroundColor: rt.themeName === 'light' ? theme.colors.accent : undefined
    },
    dynamicBox: (width: number) => ({
        width: rt.themeName === 'light' ? width : undefined,
        backgroundColor: rt.themeName === 'light' ? theme.colors.accent : undefined
    }),
    variantBox: {
        variants: {
            size: {
                wide: {
                    width: rt.themeName === 'light' ? WIDTH : undefined,
                    backgroundColor: rt.themeName === 'light' ? theme.colors.accent : undefined
                }
            }
        }
    }
}))
