import React from 'react'
import { Text, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import './unistyles'

export const App = () => {
    styles.useVariants({
        size: 'large'
    })

    console.log(styles.text(1))

    return (
        <View style={styles.container}>
            <Text style={{...styles.text(1)}}>
                Hello world
            </Text>
        </View>
    )
}

const styles = StyleSheet.create((theme, rt) => ({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.backgroundColor
    },
    text: (times: number) => ({
        fontWeight: 'bold',
        color: theme.colors.typography,
        variants: {
            size: {
                small: {
                    fontSize: 25 * times
                },
                large: {
                    fontSize: 50 * times
                }
            }
        }
    })
}))
