import React from 'react'
import { Text, View } from 'react-native'
import { createStyleSheet, useStyles } from '../styles'

// Use breakpoints for some values
export const Breakpoints: React.FunctionComponent = () => {
    const { styles } = useStyles(stylesheet)

    return (
        <View style={styles.dynamicContainer}>
            <Text>
                Breakpoint demo, resize me :)
            </Text>
            <Text>
                Row or column?
            </Text>
        </View>
    )
}

const stylesheet = createStyleSheet(theme => ({
    dynamicContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: {
            // hints for breakpoints are available here
            xs: 'row',
            md: 'column'
        },
        backgroundColor: theme.colors.sky
    }
}))
