import React from 'react'
import { View } from 'react-native'
import { mq, createStyleSheet, useStyles } from 'react-native-unistyles'

type UnistylesBoxProps = {}

export const UnistylesFullBox: React.FunctionComponent<UnistylesBoxProps> = () => {
    const { styles } = useStyles(stylesheet)

    return (
        <View style={styles.box} />
    )
}

const stylesheet = createStyleSheet(theme => ({
    box: {
        backgroundColor: theme.colors.accent,
        variants: {
            primary: {
                width: {
                    sm: 10,
                    md: 10,
                    [mq.width(100, 400).height(1000)]: 10,
                    [mq.width(400, 800).height(400)]: 10
                },
                height: {
                    sm: 10,
                    md: 10,
                    lg: 10
                }
            }
        }
    }
}))
