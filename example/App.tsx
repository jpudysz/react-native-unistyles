import React, { useRef, useState } from 'react'
import { Button, Text, View } from 'react-native'
import { StyleSheet, UnistylesShadowRegistry } from 'react-native-unistyles'
import './unistyles'

export const App = () => {
    const [, setCount] = useState(0)
    const renderCount = useRef(0)

    styles.addVariants({
        size: 'medium'
    })

    return (
        <View
            style={styles.container}
            ref={ref => {
                UnistylesShadowRegistry.add(ref, styles.container)

                return () => {
                    UnistylesShadowRegistry.remove(ref, styles.container)
                }
            }}
        >
            <Text style={styles.text}>
                Render count: {++renderCount.current}
            </Text>
            <Button title="Re-render" onPress={() => setCount(count => count + 1)} />
        </View>
    )
}

const styles = StyleSheet.create((theme, rt) => ({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    text: {
        color: theme.colors.blood,
        variants: {
            size: {
                small: {
                    fontSize: rt.fontScale * 10
                },
                medium: {
                    fontSize: rt.fontScale * 30
                },
                large: {
                    fontSize: rt.fontScale * 50
                }
            }
        },
        uni__dependencies: [2]
    }
}))
