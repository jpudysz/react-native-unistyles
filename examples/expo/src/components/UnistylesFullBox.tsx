import React from 'react'
import { View } from 'react-native'
import { mq, createStyleSheet, useStyles } from 'react-native-unistyles'

type UnistylesFullBoxProps = {
    index: number
}

export const UnistylesFullBox: React.FunctionComponent<UnistylesFullBoxProps> = ({ index }) => {
    const { styles } = useStyles(stylesheet, {
        sizes: 'primary'
    })

    return (
        <View style={styles.box(index)} />
    )
}

const stylesheet = createStyleSheet(theme => ({
    box: (index: number) => ({
        backgroundColor: index % 2 === 0
            ? theme.colors.accent
            : theme.colors.barbie,
        variants: {
            sizes: {
                primary: {
                    width: {
                        sm: 10,
                        md: 10,
                        [mq.width(100, 400).and.height(1000)]: 10,
                        [mq.width(400, 800).and.height(400)]: 10
                    },
                    height: {
                        sm: 10,
                        md: 10,
                        lg: 10,
                        [mq.width(100, 400).and.height(1000)]: 10,
                        [mq.width(400, 800).and.height(400)]: 10
                    }
                }
            }
        }
    })
}))
