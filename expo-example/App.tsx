import React, { useRef, useState } from 'react'
import { Button, Text, TouchableOpacity, View } from 'react-native'
import { StyleSheet, UnistylesRuntime } from 'react-native-unistyles'
import './unistyles'

export default function App() {
    const [state, setState] = useState(0)
    styles.useVariants({
        color: 'red',
        size: 'big'
    })

    return (
        <View style={styles.container}>
            <Text style={styles.text(state % 2 === 0)}>
                Elo elo
            </Text>
            <Button
                title='test'
                onPress={() => setState(state + 1)}
            />
        </View>
    )
}

const styles = StyleSheet.create(theme => ({
    container: {
        variants: {
            color: {
                red: {
                    backgroundColor: 'red'
                },
                green: {
                    backgroundColor: 'green'
                }
            },
        }
    },
    text: (test: boolean) => ({
        variants: {
            size: {
                small: {
                    fontSize: 10
                },
                big: {
                    fontSize: test ? 100 : 20
                }
            },
            color: {
                red: {
                    color: 'green'
                },
                green: {
                    color: 'red'
                }
            }
        }
    })
}))
