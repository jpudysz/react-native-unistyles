import React from 'react'
import { Text, View } from 'react-native'
import { createStyleSheet, useStyles } from '../styles'

// Injected theme to createStyleSheet
export const Theme: React.FunctionComponent = () => {
    const { styles } = useStyles(stylesheet)

    return (
        <View style={styles.container}>
            <Text>
                Theme example
            </Text>
        </View>
    )
}

const stylesheet = createStyleSheet(theme => ({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.oak
    }
}))
