'use client'

import { Text, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'

export default function Page() {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Hello from Unistyles</Text>
        </View>
    )
}

const styles = StyleSheet.create((theme) => ({
    container: {
        flex: 1,
        padding: 24,
        backgroundColor: theme.colors.background,
    },
    text: {
        color: theme.colors.text,
        fontSize: 24,
    },
}))
