import React from 'react'
import { Image, Text, View } from 'react-native'
import { createStyleSheet, useStyles } from '../styles'

// Use breakpoints for some values
export const Breakpoints: React.FunctionComponent = () => {
    const { styles } = useStyles(stylesheet)

    return (
        <View style={styles.dynamicContainer}>
            <Text style={styles.text}>
                Breakpoint demo, resize me :)
            </Text>
            <Text>
                Row or column?
            </Text>
            <Image
                source={{ uri: 'https://picsum.photos/600/300' }}
                style={styles.image}
            />
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
    },
    text: {
        fontWeight: 'bold'
    },
    image: {
        resizeMode: 'cover',
        overlayColor: 'red'
    }
}))
