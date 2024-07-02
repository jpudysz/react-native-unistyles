import React from 'react'
import { View, Text } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'

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
            ref={ref => {
                if (ref) {
                    console.log(ref.__nativeTag)
                    console.log(ref._viewConfig.uiViewClassName)
                    styles.text.addNode(ref.__nativeTag)
                }
            }}
        >
            Hello world from RN 0.75
        </Text>
    </View>
)

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
        // backgroundColor: 'black'
    },
    text: {
        fontSize: 20,
        color: {
            sm: 'white',
            md: 'pink'
        }
    }
})
