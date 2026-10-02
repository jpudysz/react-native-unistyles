import React from 'react'
import { FlatList, SectionList, Text, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { e2eScrollRef } from '../e2e/scroll'

const ROWS = Array.from({ length: 60 }, (_, index) => index)
const SECTIONS = [
    { title: 'First', data: [0, 1, 2] },
    { title: 'Second', data: [3, 4, 5] }
]

const flatListRef = e2eScrollRef('lists')

const Row: React.FunctionComponent<{ index: number }> = ({ index }) => (
    <View style={styles.row(index)}>
        <Text style={styles.rowText(index % 3 === 0)}>{`Row ${index}`}</Text>
    </View>
)

export default function ListsScreen() {
    return (
        <FlatList
            ref={flatListRef}
            data={ROWS}
            keyExtractor={item => String(item)}
            style={styles.list}
            contentContainerStyle={styles.content}
            ListHeaderComponent={(
                <View style={styles.header}>
                    <Text style={styles.title}>FlatList with themed rows and contentContainerStyle</Text>
                    <SectionList
                        scrollEnabled={false}
                        sections={SECTIONS}
                        keyExtractor={item => String(item)}
                        renderSectionHeader={({ section }) => <Text style={styles.sectionHeader}>{section.title}</Text>}
                        renderItem={({ item }) => <Row index={item} />}
                        contentContainerStyle={styles.sectionContent}
                    />
                </View>
            )}
            renderItem={({ item }) => <Row index={item} />}
        />
    )
}

const styles = StyleSheet.create((theme, rt) => ({
    list: {
        flex: 1,
        backgroundColor: theme.colors.background
    },
    content: {
        padding: theme.gap(2),
        paddingBottom: rt.insets.bottom + theme.gap(12),
        gap: theme.gap(1)
    },
    header: {
        gap: theme.gap(1),
        marginBottom: theme.gap(1)
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.typography
    },
    sectionHeader: {
        fontSize: 13,
        color: theme.colors.muted
    },
    sectionContent: {
        gap: theme.gap(1),
        padding: theme.gap(1),
        borderRadius: 8,
        backgroundColor: theme.colors.chip.subtle
    },
    row: (index: number) => ({
        height: 48,
        justifyContent: 'center',
        paddingHorizontal: theme.gap(2),
        borderRadius: 8,
        backgroundColor: theme.colors.surface,
        borderLeftWidth: 4,
        borderLeftColor: theme.colors.steps[index % theme.colors.steps.length]
    }),
    rowText: (isHighlighted: boolean) => ({
        color: isHighlighted ? theme.colors.primary : theme.colors.typography
    })
}))
