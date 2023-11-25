import React from 'react'
import { View } from 'react-native'
import { UnistylesRegistry } from 'react-native-unistyles'
import type { UnistylesThemes } from 'react-native-unistyles'
import { lightTheme } from '../styles'
import { Timer } from './Timer'
import { UnistylesBox } from './UnistylesBox'

UnistylesRegistry
    .addThemes({
        light: lightTheme
    } as UnistylesThemes)

type UnistylesBenchmarkScreenProps = {
    boxes: number,
    onMeasureEnd(renderTime: number): void
}

export const UnistylesWithThemeBenchmark: React.FunctionComponent<UnistylesBenchmarkScreenProps> = ({
    boxes,
    onMeasureEnd
}) => (
    <Timer onMeasureEnd={onMeasureEnd}>
        <View style={{ flexDirection: 'row', columnGap: 5 }}>
            {Array.from({ length: boxes }).map((_, index) => (
                <UnistylesBox key={index} />
            ))}
        </View>
    </Timer>
)
