import React from 'react'
import { Text, View } from 'react-native'
import { createStyleSheet, useStyles } from '../styles'

// Edge cases
export const Extreme: React.FunctionComponent = () => {
    const { styles } = useStyles(stylesheet)

    return (
        <View style={styles.dynamicContainer(1)}>
            <Text style={styles.text}>
                Edge cases
            </Text>
        </View>
    )
}

const stylesheet = createStyleSheet(theme => ({
    // dynamic function with hints
    dynamicContainer: (flex: number) => ({
        flex,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: {
            xs: theme.colors.oak,
            md: theme.colors.sky
        }
    }),
    text: {
        height: 100,
        shadowOpacity: {
            xs: 20
        },
        transform: [
            {
                scale: 2
            },
            {
                translateX: {
                    sm: 10,
                    md: 20
                }
            }
        ]
    }
}))
