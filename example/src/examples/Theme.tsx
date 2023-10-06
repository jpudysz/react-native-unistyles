import React from 'react'
import { Text, View } from 'react-native'
import { createStyles, useStyles } from '../styles'

// Injected theme to createStyles
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

const stylesheet = createStyles(theme => ({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.oak
    }
}))
