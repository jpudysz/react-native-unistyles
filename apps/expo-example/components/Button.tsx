import React from 'react'
import { Pressable, Text } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'

type ButtonProps = {
    title: string,
    onPress: () => void,
    testID?: string
}

export const Button: React.FunctionComponent<ButtonProps> = ({ title, onPress, testID }) => (
    <Pressable testID={testID} accessibilityRole="button" onPress={onPress} style={styles.button}>
        <Text style={styles.text}>{title}</Text>
    </Pressable>
)

const styles = StyleSheet.create(theme => ({
    button: {
        backgroundColor: theme.colors.primary,
        borderRadius: 8,
        paddingVertical: theme.gap(1),
        paddingHorizontal: theme.gap(2),
        alignItems: 'center'
    },
    text: {
        color: theme.colors.chip.onFill,
        fontWeight: '600'
    }
}))
