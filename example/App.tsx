import React, { useRef } from 'react'
import { Text, View } from 'react-native'
import { StyleSheet, UnistylesRuntime } from 'react-native-unistyles'
import './unistyles'

export const App = () => {
    const renderCount = useRef(0)
    // fix bug with attaching methods to styles
    // styles.addVariants({
    //     color: 'blue',
    //     size: 'small'
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
        </View>
    )
}

const styles = StyleSheet.create((theme, rt) => ({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.accent,
        width: rt.screen.width / 2,
        height: rt.screen.height / 2,
        uni__dependencies: [2, 6]
    },
    text: {
        color: theme.colors.backgroundColor,
        backgroundColor: theme.colors.typography
    }
}))
