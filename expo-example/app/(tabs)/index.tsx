import React from 'react'
import { View, Text } from 'react-native'
import { ScopedTheme, StyleSheet } from 'react-native-unistyles'

export default function HomeScreen() {
    return (
        <View style={styles.container}>
            <ScopedTheme name="premium">
                    <Text style={styles.typography}>
                        Nested premium theme
                    </Text>
                    <ScopedTheme name="dark">
                        <Text style={styles.typography}>
                            Nested dark theme
                        </Text>
                    </ScopedTheme>
                </ScopedTheme>
            <ScopedTheme invertedAdaptive>
                <View style={styles.box}>
                    <Text style={styles.typography}>
                        This box has an accent color, so it should be pink in light mode and red in dark mode
                    </Text>
                </View>
                <Text style={styles.typography}>
                    This text has a background color, so it should be dark for light mode and light for dark mode
                </Text>
                <ScopedTheme name="premium">
                    <Text style={styles.typography}>
                        Nested premium theme
                    </Text>
                    <ScopedTheme name="light">
                        <Text style={styles.typography}>
                            Nested light theme
                        </Text>
                    </ScopedTheme>
                </ScopedTheme>
                <Text style={styles.typography}>
                    Again scoped theme with invertedAdaptive
                </Text>
            </ScopedTheme>
        </View>
    )
}

const styles = StyleSheet.create(theme => ({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
        gap: 12,
        backgroundColor: theme.colors.backgroundColor
    },
    typography: {
        fontSize: 12,
        textAlign: 'center',
        color: theme.colors.backgroundColor
    },
    box: {
        width: 100,
        height: 100,
        padding: 5,
        backgroundColor: theme.colors.accent
    }
}))
