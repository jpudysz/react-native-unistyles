import React from 'react'
import { Pressable, Text, View } from 'react-native'
import { Link } from 'expo-router'
import { StyleSheet } from 'react-native-unistyles'
import { Screen } from '../components'
import { screens } from '../consts'

export default function HomeScreen() {
    return (
        <Screen>
            <Text style={styles.intro}>
                Every screen covers a group of features. Flip the theme in the header anywhere, pushed screens freeze the ones below them.
            </Text>
            {screens.map((screen, index) => (
                <Link key={screen.route} href={`/${screen.route}`} asChild>
                    <Pressable testID={`screen-${screen.route}`} style={styles.card(index)}>
                        <View style={styles.badge(index)} />
                        <View style={styles.cardContent}>
                            <Text style={styles.title}>{screen.title}</Text>
                            <Text style={styles.description}>{screen.description}</Text>
                        </View>
                    </Pressable>
                </Link>
            ))}
        </Screen>
    )
}

const styles = StyleSheet.create(theme => ({
    intro: {
        fontSize: 14,
        color: theme.colors.muted
    },
    card: (index: number) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.gap(2),
        padding: theme.gap(2),
        borderRadius: 12,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: index % 2 === 0 ? theme.colors.border : theme.colors.primary
    }),
    badge: (index: number) => ({
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: theme.colors.steps[index % theme.colors.steps.length]
    }),
    cardContent: {
        flex: 1,
        gap: theme.gap(0.5)
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.typography
    },
    description: {
        fontSize: 13,
        color: theme.colors.muted
    }
}))
