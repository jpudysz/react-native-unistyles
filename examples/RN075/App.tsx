import React from 'react'
import { View, Text } from 'react-native'
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
StyleSheet.addConfig({
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

export const App = () => (
    <View
        // style={styles.container}
        ref={ref => {
            if (ref) {
                console.log(ref.__nativeTag)
                styles.container.addNode(ref.__nativeTag)
            }
        }}
    >
        <Text
            // style={styles.text}
            ref={ref => {
                if (ref) {
                    console.log(ref.__nativeTag)
                    console.log(ref._viewConfig.uiViewClassName)
                    // styles.text.addNode(ref.__nativeTag)
                }
            }}
        >
            Hello world from RN 0.75
        </Text>
    </View>
)

const styles = StyleSheet.create(theme => {
    const result = {
        container: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: theme.gap(2)
        },
        text: {
            fontSize: 20,
            fontWeight: 'bold'
        }
    }

    console.log(result)

    return result
})
