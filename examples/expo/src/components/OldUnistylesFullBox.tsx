import React from 'react'
import { View } from 'react-native'
import { createStyleSheet, useStyles } from './oldUnistyles'

type UnistylesFullBoxProps = {
    index: number
}

export const OldUnistylesFullBox: React.FunctionComponent<UnistylesFullBoxProps> = ({ index }) => {
    const { styles } = useStyles(stylesheet)

    return (
        <View style={styles.box(index)} />
    )
}

const stylesheet = createStyleSheet(theme => ({
    box: (index: number) => ({
        backgroundColor: index % 2 === 0
            ? theme.colors.accent
            : theme.colors.barbie,
        width: {
            sm: 10,
            md: 10,
            ':w[100, 400]:h[1000]': 10,
            ':w[400, 800]:h[400]': 10
        },
        height: {
            sm: 10,
            md: 10,
            lg: 10,
            ':w[100, 400]:h[1000]': 10,
            ':w[400, 800]:h[400]': 10
        }
    })
}))
