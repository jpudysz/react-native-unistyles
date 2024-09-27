import React, { useRef, useState } from 'react'
import { Button, Text, View } from 'react-native'
import { StyleSheet, UnistylesShadowRegistry } from 'react-native-unistyles'
import './unistyles'

export const App = () => {
    const [, setCount] = useState(0)
    const renderCount = useRef(0)

    styles.useVariants({
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
            <Text
                style={styles.text('normal', 'italic')}
                ref={ref => {
                    UnistylesShadowRegistry.add(ref, styles.text)

                    return () => {
                        UnistylesShadowRegistry.remove(ref, styles.text)
                    }
                }}
            >
                Render count: {++renderCount.current}
            </Text>
            <Button
                title="Re-render"
                onPress={() => setCount(count => count + 1)}
            />
            <View style={{ height: 50}} />
        </View>
    )
}

const styles = StyleSheet.create((theme, rt) => ({
    container: {
        flex: 1,
        justifyContent: rt.colorScheme === 'dark'
            ? 'center'
            : 'flex-end',
        alignItems: 'center',
        backgroundColor: rt.colorScheme === 'dark'
            ? theme.colors.barbie
            : theme.colors.oak,
        uni__dependencies: [4]
    },
    text: (fontWeight: 'bold' | 'normal', fontStyle: 'italic' | 'normal') => ({
        fontWeight,
        fontStyle,
        color: theme.colors.typography,
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
        uni__dependencies: [2, 4]
    })
}))
