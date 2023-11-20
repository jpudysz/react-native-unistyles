import React from 'react'
import { View } from 'react-native'
import { UnistylesRegistry } from 'react-native-unistyles'
import type { UnistylesThemes } from 'react-native-unistyles'
import { lightTheme } from '../styles'
import { Timer } from './Timer'
import { UnistylesBox } from './UnistylesBox'

type UnistylesBenchmarkScreenProps = {
    onMeasureEnd(renderTime: number): void
}

export const UnistylesWithThemeBenchmark: React.FunctionComponent<UnistylesBenchmarkScreenProps> = ({ onMeasureEnd }) => {
    UnistylesRegistry
        .addThemes({
            light: lightTheme
        } as UnistylesThemes)

    return (
        <Timer onMeasureEnd={onMeasureEnd}>
            <View style={{ flexDirection: 'row', columnGap: 5 }}>
                {Array.from({ length: 1000 }).map((_, index) => (
                    <UnistylesBox key={index} />
                ))}
            </View>
        </Timer>
    )
}
