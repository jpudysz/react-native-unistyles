import React, { useState } from 'react'
import { View, Text, Button } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import type { UnistylesThemes } from 'react-native-unistyles'

const sharedColors = {
    barbie: '#ff9ff3',
    oak: '#1dd1a1',
    sky: '#48dbfb',
    fog: '#c8d6e5',
    aloes: '#00d2d3',
    blood: '#ff6b6b'
}

// todo extend me
StyleSheet.configure({
    themes: {
        light: {
            colors: {
                ...sharedColors,
                backgroundColor: '#ffffff',
                typography: '#000000',
                accent: sharedColors.blood
            }
        },
        dark: {
            colors: {
                ...sharedColors,
                backgroundColor: '#000000',
                typography: '#ffffff',
                accent: sharedColors.barbie
            }
        }
    } as UnistylesThemes
})

export const App = () => {
    const [isTextHidden, setIsTextHidden] = useState(false)
    console.log(`Dynamic function:${JSON.stringify(styles.dynamicText(10))}`)

    return (
        <View
            style={styles.container}
            ref={ref => {
                console.log(ref.__nativeTag)
                styles.container.addNode(ref.__nativeTag)

                return () => {
                    styles.container.removeNode(ref.__nativeTag)
                }
            }}
        >
            {!isTextHidden && (
                <Text
                    style={styles.text}
                    ref={ref => {
                        console.log(ref.__nativeTag)
                        console.log(ref._viewConfig.uiViewClassName)
                        styles.text.addNode(ref.__nativeTag)

                        return () => {
                            styles.text.removeNode(ref.__nativeTag)
                        }
                    }}
                >
                    Hello world from RN 0.75
                </Text>
            )}
            <Button title="Toggle text" onPress={() => setIsTextHidden(!isTextHidden)} />
        </View>
    )
}

const styles = StyleSheet.create((theme, rt) => {
    const result = {
        container: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingBottom: rt.insets.bottom,
            paddingHorizontal: theme.gap(2),
            __unistyles__dependencies_: ['$0', '$1']
        },
        text: {
            fontSize: 20,
            fontWeight: 'bold',
            __unistyles__dependencies_: []
        },
        dynamicText: (paddingLeft: number) => ({
            paddingLeft: rt.insets.bottom + paddingLeft,
            __unistyles__dependencies_: ['$1']
        })
    }

    console.log(result)

    return result
})
