import React, { useRef, useState } from 'react'
import { Pressable, Switch, Text, TextInput, TouchableHighlight, TouchableOpacity, View } from 'react-native'
import { ScopedTheme, StyleSheet } from 'react-native-unistyles'
import { Screen, Section } from '../components'
import { useE2EAction } from '../e2e/actions'
import { countPress } from '../e2e/presses'

// Re-renders only itself, like most stateful leaves
const LocalSwitch = () => {
    const [isOn, setIsOn] = useState(false)

    return (
        <Switch
            testID="interactions-switch"
            value={isOn}
            onValueChange={value => {
                countPress('interactions-switch')
                setIsOn(value)
            }}
            style={styles.switch}
        />
    )
}

const ScopedCounter = () => {
    const [count, setCount] = useState(0)

    return (
        <Pressable
            testID="interactions-scoped-counter"
            onPress={() => {
                countPress('interactions-scoped-counter')
                setCount(value => value + 1)
            }}
            style={styles.tile}
        >
            <Text style={styles.tileText}>{`Counter ${count}`}</Text>
        </Pressable>
    )
}

// Presses don't change the state of this screen, every component re-renders on its own (or not at all)
export default function InteractionsScreen() {
    const [tone, setTone] = useState<'primary' | 'accent'>('primary')
    const inputRef = useRef<TextInput>(null)

    styles.useVariants({ tone })

    useE2EAction('interactions.tone', () => setTone(value => value === 'primary' ? 'accent' : 'primary'))
    useE2EAction('interactions.blur', () => inputRef.current?.blur())

    return (
        <Screen>
            <Section title="Touchables">
                <View style={styles.row}>
                    <TouchableHighlight testID="interactions-highlight" style={styles.highlight} onPress={() => countPress('interactions-highlight')}>
                        <Text style={styles.tileText}>Highlight</Text>
                    </TouchableHighlight>
                    <TouchableOpacity testID="interactions-opacity" style={styles.highlight} onPress={() => countPress('interactions-opacity')}>
                        <Text style={styles.tileText}>Opacity</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.row}>
                    <TouchableHighlight
                        testID="interactions-highlight-variant"
                        style={[styles.variantTile, styles.bordered]}
                        onPress={() => countPress('interactions-highlight-variant')}
                    >
                        <Text style={styles.tileText}>Variant</Text>
                    </TouchableHighlight>
                    <TouchableHighlight
                        testID="interactions-highlight-fn"
                        style={styles.dynamicTile(2)}
                        onPress={() => countPress('interactions-highlight-fn')}
                    >
                        <Text style={styles.tileText}>Function</Text>
                    </TouchableHighlight>
                </View>
                <View style={styles.row}>
                    <Pressable testID="interactions-pressable" style={styles.tile} onPress={() => countPress('interactions-pressable')}>
                        <Text style={styles.tileText}>Pressable</Text>
                    </Pressable>
                    <Pressable
                        testID="interactions-pressable-fn"
                        style={state => styles.pressedTile(state.pressed)}
                        onPress={() => countPress('interactions-pressable-fn')}
                    >
                        <Text style={styles.tileText}>Style function</Text>
                    </Pressable>
                </View>
            </Section>
            <Section title="Text, inputs and switches">
                <View style={styles.row}>
                    {/* iOS doesn't expose the testID of a pressable Text, the host taps the center of this box */}
                    <View accessible testID="interactions-text" style={styles.textBox}>
                        <Text style={styles.pressableText} onPress={() => countPress('interactions-text')}>
                            Pressable text
                        </Text>
                    </View>
                    <LocalSwitch />
                </View>
                <TextInput
                    ref={inputRef}
                    testID="interactions-input"
                    style={styles.input}
                    defaultValue="TextInput"
                    onFocus={() => countPress('interactions-input')}
                />
            </Section>
            <Section title="Scoped dark theme">
                <ScopedTheme name="dark">
                    <View style={styles.row}>
                        <ScopedCounter />
                        <Pressable
                            testID="interactions-scoped-pressable-fn"
                            style={state => styles.pressedTile(state.pressed)}
                            onPress={() => countPress('interactions-scoped-pressable-fn')}
                        >
                            <Text style={styles.tileText}>Style function</Text>
                        </Pressable>
                        <TouchableHighlight
                            testID="interactions-scoped-highlight"
                            style={styles.highlight}
                            onPress={() => countPress('interactions-scoped-highlight')}
                        >
                            <Text style={styles.tileText}>Highlight</Text>
                        </TouchableHighlight>
                    </View>
                </ScopedTheme>
            </Section>
        </Screen>
    )
}

const styles = StyleSheet.create(theme => ({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.gap(1)
    },
    tile: {
        flex: 1,
        height: 40,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.primary
    },
    tileText: {
        color: theme.colors.chip.onFill,
        fontWeight: '600'
    },
    highlight: {
        flex: 1,
        height: 40,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.secondary
    },
    variantTile: {
        flex: 1,
        height: 40,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        variants: {
            tone: {
                primary: {
                    backgroundColor: theme.colors.primary
                },
                accent: {
                    backgroundColor: theme.colors.accent
                }
            }
        }
    },
    bordered: {
        borderWidth: 2,
        borderColor: theme.colors.border
    },
    dynamicTile: (index: number) => ({
        flex: 1,
        height: 40,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.steps[index]
    }),
    pressedTile: (isPressed: boolean) => ({
        flex: 1,
        height: 40,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: isPressed ? theme.colors.accent : theme.colors.primary
    }),
    textBox: {
        flex: 1
    },
    pressableText: {
        fontSize: 16,
        color: theme.colors.primary,
        backgroundColor: theme.colors.chip.subtle
    },
    switch: {
        backgroundColor: theme.colors.background
    },
    input: {
        height: 40,
        paddingHorizontal: theme.gap(1),
        borderWidth: 1,
        borderRadius: 8,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.background,
        color: theme.colors.typography
    }
}))
