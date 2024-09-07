import React, { useRef } from 'react'
import { Text, View } from 'react-native'
import { StyleSheet, UnistylesRuntime } from 'react-native-unistyles'
import './unistyles'

export const App = () => {
    const renderCount = useRef(0)
    styles.addVariants({
        color: 'primary'
    })

    return (
        <View
            style={styles.container(1)}
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
    container: (flex: number) => ({
        flex,
        justifyContent: rt.orientation == 'portrait'
            ? 'center'
            : 'flex-end',
        alignItems: 'center',
        backgroundColor: {
            sm: theme.colors.accent,
            md: theme.colors.barbie,
        },
        width: rt.screen.width / 2,
        height: rt.screen.height / 2,
        variants: {
            color: {
                primary: {
                    backgroundColor: theme.colors.accent
                },
                secondary: {
                    backgroundColor: theme.colors.barbie
                }
            }
        },
        uni__dependencies: [2, 6]
    }),
    text: {
        color: theme.colors.backgroundColor,
        backgroundColor: theme.colors.typography
    }
}))
