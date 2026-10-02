// #1192: a toggle after a theme change asks React for a value it already rendered under the old theme,
// so React sends nothing and the value written by the theme change sticks (fixed by relinking with outdated native props)
import React, { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { Screen, Section } from '../components'
import { useE2EAction } from '../e2e/actions'

const ITEMS = ['Item 1', 'Item 2', 'Item 3', 'Item 4']

export default function DynamicFunctionsScreen() {
    const [selected, setSelected] = useState<Array<number>>([])
    const [count, setCount] = useState(1)

    const toggle = (index: number) => setSelected(current => current.includes(index)
        ? current.filter(item => item !== index)
        : [...current, index]
    )

    useE2EAction('chips.toggle', index => toggle(Number(index)))
    useE2EAction('chips.count', () => setCount(value => value % 4 + 1))

    return (
        <Screen>
            <Section title="Shared dynamic function" description="Every chip calls styles.chip(isSelected) and styles.chipText(isSelected)">
                <View style={styles.row}>
                    {ITEMS.map((item, index) => {
                        const isSelected = selected.includes(index)

                        return (
                            <Pressable
                                key={item}
                                testID={`chip-${index}`}
                                onPress={() => toggle(index)}
                                style={styles.chip(isSelected)}
                            >
                                <Text style={styles.chipText(isSelected)}>{item}</Text>
                            </Pressable>
                        )
                    })}
                </View>
            </Section>
            <Section title="Arguments from state" description="styles.bar(count) with a number argument">
                <Pressable onPress={() => setCount(value => value % 4 + 1)}>
                    <View style={styles.bar(count)} />
                </Pressable>
                <Text style={styles.caption(count > 2)}>{`count ${count}`}</Text>
            </Section>
        </Screen>
    )
}

const styles = StyleSheet.create(theme => ({
    row: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.gap(1)
    },
    chip: (isSelected: boolean) => ({
        paddingHorizontal: theme.gap(1.5),
        paddingVertical: theme.gap(1),
        borderRadius: 16,
        backgroundColor: isSelected ? theme.colors.chip.fill : theme.colors.chip.subtle
    }),
    chipText: (isSelected: boolean) => ({
        color: isSelected ? theme.colors.chip.onFill : theme.colors.chip.onSubtle,
        fontWeight: isSelected ? 'bold' : 'normal'
    }),
    bar: (count: number) => ({
        height: 16,
        width: `${count * 25}%` as const,
        borderRadius: 8,
        backgroundColor: theme.colors.steps[count % theme.colors.steps.length]
    }),
    caption: (isHighlighted: boolean) => ({
        color: isHighlighted ? theme.colors.accent : theme.colors.muted
    })
}))
