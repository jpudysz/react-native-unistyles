import React, { useRef, useState } from 'react'
import { Button, Text, View } from 'react-native'
import { StyleSheet, UnistylesRuntime } from 'react-native-unistyles'
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
                    styles.container.uni__addNode(ref.__nativeTag)
                }

                return () => {
                    styles.container.uni__removeNode(ref.__nativeTag)
                }
            }}
        >
            <Text style={styles.text}>
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
