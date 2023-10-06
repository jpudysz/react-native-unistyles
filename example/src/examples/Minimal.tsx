import React from 'react'
import { Text, View, StyleSheet } from 'react-native'
import { useStyles } from '../styles'

// Compatibility between StyleSheet.create and useStyles
// access theme from useStyles
export const Minimal: React.FunctionComponent = () => {
    const { styles, theme } = useStyles(stylesheet)

    return (
        <View style={styles.container}>
            <Text>
                I'm just a minimal example with {theme.colors.barbie} color
            </Text>
        </View>
    )
}

const stylesheet = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    }
})
