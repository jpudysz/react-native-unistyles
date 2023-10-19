import React from 'react'
import { Text, View, StyleSheet } from 'react-native'
import { useStyles } from '../styles'

export const Next: React.FunctionComponent = () => {
    const { styles } = useStyles(stylesheet)

    return (
        <View style={styles.container}>
            <Text>
                Next!
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
