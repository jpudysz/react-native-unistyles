import React from 'react'
import { Text, View } from 'react-native'
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
        width: 100,
        height: 100,
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
    }
}))
