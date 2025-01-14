import { Button, ScrollView, Text as RNText, View, ViewProps } from 'react-native'
import { withUnistyles } from 'react-native-unistyles'
import React, { PropsWithChildren, useState } from 'react'
import { st } from './st'
import './unistyles'

type TextProps = PropsWithChildren & {
    value: number,
    size: 'small' | 'large'
}

const Text: React.FunctionComponent<TextProps> = ({ value, children, size }) => {
    styles.useVariants({
        size
    })

    return (
        <RNText style={[styles.text(value), styles.bg1]}>
            {children}
        </RNText>
    )
}

const ComponentA: React.FunctionComponent<ViewProps>  = ({ style }) => {
    return (
        <ComponentB style={[styles.bg1, style]} />
    )
}

const ComponentB: React.FunctionComponent<ViewProps>  = ({ style }) => {
    return (
        <View style={[style, { height: 100, width: 100 }]} />
    )
}

const UniScrollView = withUnistyles(ScrollView)

export const App = () => {
    const [counter, setCounter] = useState(0)

    console.log(styles.container)

    return (
        <View style={styles.container}>
            <UniScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollView}
            >
                <Text value={1.1} size="small">
                    Hello world 1
                </Text>
                <Text value={1.5} size="small">
                    Hello world 2
                </Text>
                <Text value={1} size="large">
                    Hello world 3
                </Text>
                <ComponentA style={[{ borderWidth: 5 }, { borderColor: 'pink'}]} />
                <Button title="Re-render" onPress={() => setCounter(counter + 1)} />
            </UniScrollView>
        </View>
    )
}

const styles = st.create((theme, rt) => ({
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
    }),
    bg1: {
        backgroundColor: 'red'
    },
    scrollView: {
        backgroundColor: theme.colors.backgroundColor
    }
}))
