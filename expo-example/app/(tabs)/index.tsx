import React from 'react'
import { Link } from 'expo-router'
import { Pressable, View, Text, SafeAreaView } from 'react-native'
import { StyleSheet, UnistylesRuntime } from 'react-native-unistyles'

export default function HomeScreen() {
    styles.useVariants({
        variant: 'blue'
    })

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.test}>
                <Text style={styles.typography}>
                    Hello world!
                </Text>
                <Link href="/explore" asChild>
                    <Pressable style={styles.button}>
                        <Text style={styles.typography}>
                            Explore
                        </Text>
                    </Pressable>
                </Link>
                <Pressable onPress={() => UnistylesRuntime.getTheme()}>
                    <Text style={styles.typography}>
                        Press me
                    </Text>
                </Pressable>
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create(theme => ({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.backgroundColor
    },
    typography: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.typography
    },
    test: {
        width: '100%',
        variants: {
            variant: {
                red: {
                    backgroundColor: 'red'
                },
                blue: {
                    backgroundColor: 'blue'
                }
            }
        }
    },
    button: {
        backgroundColor: theme.colors.aloes,
        padding: 10,
        borderRadius: 8,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%'
    }
}))
