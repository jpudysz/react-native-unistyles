import React from 'react'
import { Text, View } from 'react-native'
import { createStyleSheet, useStyles } from '../styles'

// useStyles should allow empty objects as styles
export const EmptyStyles: React.FunctionComponent = () => {
    const { styles } = useStyles(stylesheet)

    return (
        <View style={styles.emptyContainer}>
            <Text style={styles.empty}>
                My styles are empty
            </Text>
        </View>
    )
}

const stylesheet = createStyleSheet({
    emptyContainer: {},
    empty: {}
})
