import React from 'react'
import { PlatformColor, Text, View } from 'react-native'
import { StyleSheet, UnistylesRuntime, mq } from 'react-native-unistyles'
import './unistyles'

export const App = () => {
    console.log(JSON.stringify(styles))

    styles.uni__addVariants({
        size: 'medium'
    })

    return (
        <View style={styles.container}>
            <Text>
                Current breakpoint: {UnistylesRuntime.breakpoint}
            </Text>
        </View>
    )
}

const styles = StyleSheet.create(theme => ({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
            }
        }
    },
    nestedProps: {
        backgroundColor: {
            [mq.only.width('sm', 200)]: theme.colors.accent,
            sm: PlatformColor('label')
        }
    },
}))
