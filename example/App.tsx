import React from 'react'
import { Text, View } from 'react-native'
import { StyleSheet, UnistylesRuntime } from 'react-native-unistyles'
import './unistyles'

export const App = () => {
    styles.addVariants({
        color: 'blue',
        size: 'small'
    })

    return (
        <View style={styles.container}>
            <Text>
                Current breakpoint: {UnistylesRuntime.breakpoint}
            </Text>
        </View>
    )
}

const styles = StyleSheet.create((theme, rt) => ({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: rt.screen.width > 500
            ? theme.colors.backgroundColor
            : 'red',
        variants: {
            size: {
                small: {
                    width: 100,
                    height: 100
                },
                medium: {
                    width: 200,
                    height: 200
                },
                large: {
                    width: 300,
                    height: 300
                }
            },
            color: {
                red: {
                    backgroundColor: 'red'
                },
                green: {
                    backgroundColor: 'green'
                },
                blue: {
                    backgroundColor: '#a4a4e5'
                }
            }
        },
        compoundVariants: [
            {
                color: 'blue',
                size: 'small',
                styles: {
                    width: '100%',
                    height: '100%'
                }
            }
        ],
        uni__dependencies: [2, 6]
    }
}))
