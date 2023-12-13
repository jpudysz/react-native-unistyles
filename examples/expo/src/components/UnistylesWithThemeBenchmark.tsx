import React from 'react'
import { View } from 'react-native'
import { UnistylesRegistry } from 'react-native-unistyles'
import type { UnistylesThemes } from 'react-native-unistyles'
import { breakpoints, lightTheme } from '../styles'
import { Timer } from './Timer'
import { UnistylesBox } from './UnistylesBox'

type UnistylesBenchmarkScreenProps = {
    boxes: number,
    onMeasureEnd(renderTime: number): void
}

export const UnistylesWithThemeBenchmark: React.FunctionComponent<UnistylesBenchmarkScreenProps> = ({
    boxes,
    onMeasureEnd
}) => {
    UnistylesRegistry
        .addBreakpoints(breakpoints)
        .addThemes({
            light: lightTheme
        } as UnistylesThemes)

    return (
        <Timer onMeasureEnd={onMeasureEnd}>
            <View style={{ flexDirection: 'row', columnGap: 5 }}>
                {Array.from({ length: boxes }).map((_, index) => (
                    <UnistylesBox key={index} />
                ))}
            </View>
        </Timer>
    )
}
