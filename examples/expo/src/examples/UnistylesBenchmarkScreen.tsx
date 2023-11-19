import React from 'react'
import { View } from 'react-native'
import { UnistylesRegistry, useStyles, createStyleSheet } from 'react-native-unistyles'
import type { UnistylesThemes } from 'react-native-unistyles'
import { lightTheme } from '../styles'
import { Timer } from '../components'

type UnistylesBenchmarkScreenProps = {
    onMeasureEnd(renderTime: number): void
}

export const UnistylesBenchmarkScreen: React.FunctionComponent<UnistylesBenchmarkScreenProps> = ({ onMeasureEnd }) => {
    UnistylesRegistry
        .addThemes({
            light: lightTheme
        } as UnistylesThemes)
    const { styles } = useStyles(stylesheet)

    return (
        <Timer onMeasureEnd={onMeasureEnd}>
            <View style={styles.row}>
                {Array.from({ length: 1000 }).map((_, index) => (
                    <View
                        key={index}
                        style={styles.box}
                    />
                ))}
            </View>
        </Timer>
    )
}

const stylesheet = createStyleSheet(theme => ({
    row: {
        flexDirection: 'row',
        columnGap: 5
    },
    box: {
        backgroundColor: theme.colors.accent,
        width: 10,
        height: 10
    }
}))
