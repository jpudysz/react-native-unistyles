import React from 'react'
import { Text, View } from 'react-native'
import { createStyleSheet, useStyles } from '../styles'

// createStyleSheet with StyleSheet.create compatible Object
export const MinimalWithCreateStyleSheet: React.FunctionComponent = () => {
    const { styles } = useStyles(stylesheet)

    return (
        <View style={styles.container}>
            <Text style={styles.text}>
                I'm just a minimal example with createStyleSheet
            </Text>
        </View>
    )
}

const stylesheet = createStyleSheet({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        alignContent: 'space-between',
        resizeMode: 'contain'
    },
    text: {
        borderWidth: 1,
        borderColor: 'purple',
        padding: 20,
        flex: {
            xs: 2,
            md: 1
        }
    }
})
