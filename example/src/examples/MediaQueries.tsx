import React from 'react'
import { Text, View } from 'react-native'
import { createStyles, useStyles } from '../styles'

// Media queries
export const MediaQueries: React.FunctionComponent = () => {
    const { styles } = useStyles(stylesheet)

    return (
        <View style={styles.dynamicContainer}>
            <Text>
                Media queries, resize me :)
            </Text>
            <Text>
                Row of column
            </Text>
        </View>
    )
}

const stylesheet = createStyles(theme => ({
    dynamicContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: {
            xs: 'row',
            // mixed queries
            ':w[400]': 'column'
        },
        backgroundColor: {
            ':w[, 300]:h[100]': theme.colors.oak,
            ':w[301]': theme.colors.barbie
        }
    }
}))
