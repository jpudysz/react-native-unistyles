import { Link } from 'expo-router'
import React from 'react'
import { Pressable, Text, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'

export default function HomeScreen() {
    styles.useVariants({
        variant: 'blue'
    })

    return (
        <View style={styles.container}>
            <View style={styles.test}>
                <Text>
                    Hello world
                </Text>
                <Link href="/explore" asChild>
                    <Pressable style={styles.button}>
                        <Text>
                            Explore
                        </Text>
                    </Pressable>
                </Link>
            </View>
        </View>
    )
}

const styles = StyleSheet.create(theme => ({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.backgroundColor
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
