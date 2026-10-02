import React from 'react'
import { ScrollView, Text, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'

type ScreenProps = React.PropsWithChildren<{
    scrollRef?: React.Ref<ScrollView>
}>

export const Screen: React.FunctionComponent<ScreenProps> = ({ children, scrollRef }) => (
    <ScrollView ref={scrollRef} style={styles.screen} contentContainerStyle={styles.content}>
        {children}
    </ScrollView>
)

type SectionProps = React.PropsWithChildren<{
    title: string,
    description?: string
}>

export const Section: React.FunctionComponent<SectionProps> = ({ title, description, children }) => (
    <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
        {children}
    </View>
)

const styles = StyleSheet.create((theme, rt) => ({
    screen: {
        flex: 1,
        backgroundColor: theme.colors.background
    },
    content: {
        padding: theme.gap(2),
        paddingBottom: rt.insets.bottom + theme.gap(12),
        gap: theme.gap(2)
    },
    section: {
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: theme.gap(2),
        gap: theme.gap(1)
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.typography
    },
    description: {
        fontSize: 13,
        color: theme.colors.muted
    }
}))
