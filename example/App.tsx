import React, { useRef, useState } from 'react'
import { Button, Text, View } from 'react-native'
import { StyleSheet, UnistylesRuntime, ShadowRegistry } from 'react-native-unistyles'
import './unistyles'

export const App = () => {
    const [, setCount] = useState(0)
    const renderCount = useRef(0)
    // styles.addVariants({
    //     color: 'primary'
    // })

    return (
        <View
            style={styles.container}
            ref={ref => {
                if (ref) {
                    //tag
                    ShadowRegistry.add(styles.container, ref)
                }

                return () => {
                    ShadowRegistry.remove(styles.container, ref)
                }
            }}
        >
            <Text
                style={styles.text}
                ref={ref => {
                    if (ref) {
                        ShadowRegistry.add(styles.text, ref)
                    }

                    return () => {
                        ShadowRegistry.remove(styles.text, ref)
                    }
                }}
            >
                Screen: {UnistylesRuntime.screen.width}x{UnistylesRuntime.screen.height}
            </Text>
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
        justifyContent: rt.orientation == 'portrait'
            ? 'center'
            : 'flex-end',
        alignItems: 'center',
        opacity: rt.orientation == 'portrait'
            ? 1
            : 0.5,
        backgroundColor: rt.orientation == 'portrait'
            ? theme.colors.barbie
            : theme.colors.fog,
        borderRadius: rt.orientation == 'portrait'
            ? 0
            : 10,
        width: rt.screen.width / 2,
        height: rt.screen.height / 2,
        uni__dependencies: [2, 6]
    },
    text: {
        color: theme.colors.backgroundColor,
        backgroundColor: theme.colors.typography
    }
}))
