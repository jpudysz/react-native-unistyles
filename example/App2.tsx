import { Text as RNText, View } from 'react-native'
import React, { PropsWithChildren } from 'react'
import { StyleSheet, UnistylesVariants } from 'react-native-unistyles'
import './unistyles'

type TextProps = PropsWithChildren & UnistylesVariants<typeof styles> & {
    value: number
}

const Text: React.FunctionComponent<TextProps> = ({ value, children, size }) => {
    styles.useVariants({
        size
    })

    console.log(styles.text(value))

    return (
        <RNText style={styles.text(value)}>
            {children}
        </RNText>
    )
}

export const App = () => {
    return (
        <View style={styles.container}>
            <Text value={1.1} size="small">
                Hello world 1
            </Text>
            <Text value={1.5} size="small">
                Hello world 2
            </Text>
            <Text value={1} size="large">
                Hello world 3
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
