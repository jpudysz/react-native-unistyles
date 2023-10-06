import React from 'react'
import { Pressable, Text, View } from 'react-native'
import { createStyleSheet, useStyles } from '../styles'

type ExtremeProps = {
    onToggleTheme: VoidFunction
}

// Edge cases
export const Extreme: React.FunctionComponent<ExtremeProps> = ({ onToggleTheme }) => {
    const { styles } = useStyles(stylesheet)

    return (
        <View style={styles.dynamicContainer(1)}>
            <Text style={styles.text}>
                Edge cases
            </Text>
            <Pressable onPress={onToggleTheme}>
                <Text style={styles.text}>
                    Change theme
                </Text>
            </Pressable>
        </View>
    )
}

const stylesheet = createStyleSheet(theme => ({
    // dynamic function with hints
    dynamicContainer: (flex: number) => ({
        flex,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.backgroundColor,
        transform: [
            {
                scale: {
                    xs: 2,
                    md: 1
                }
            }
        ],
        shadowOffset: {
            width: 1,
            height: {
                xs: 1,
                md: 5
            }
        }
    }),
    text: {
        height: 100,
        color: theme.colors.typography,
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
