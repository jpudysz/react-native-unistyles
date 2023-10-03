import React from 'react'
import { Text, View } from 'react-native'
import { createStyles, useStyles } from './styles'

export const ExampleScreen: React.FunctionComponent = () => {
    const { styles } = useStyles(stylesheet)

    return (
        <View style={styles.container}>
            <Text>
                Resize me :)
            </Text>
        </View>
    )
}

const stylesheet = createStyles(theme => ({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: {
            sm: theme.colors.oak,
            md: theme.colors.aloes,
            ':w[800]': theme.colors.fog
        }
    }
}))
