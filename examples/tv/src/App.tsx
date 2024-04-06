import React from 'react'
// import { useStyles, createStyleSheet, UnistylesRuntime } from 'react-native-unistyles'
import { View, Text, Pressable, StyleSheet } from 'react-native'
// import './styles'

// todo link Unistyles
export const App: React.FunctionComponent = () => (
    <View style={styles.container}>
        <Text style={styles.text}>
            Hello
            <Text style={styles.highlight}>
                {` tvOS`}
            </Text>
        </Text>
        <Pressable
            style={styles.cta}
            onPress={() => {}}
        >
            <Text style={styles.text}>Switch theme</Text>
        </Pressable>
    </View>
)

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 50,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'black'
    },
    text: {
        fontSize: 20,
        color: 'white'
    },
    highlight: {
        fontWeight: 'bold',
        color: 'pink'
    },
    cta: {
        backgroundColor: 'pink',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
        borderRadius: 12,
        marginBottom: 20
    }
})
