import React from 'react'
import { View } from 'react-native'
import { UnistylesTheme } from 'old-unistyles'
import { lightTheme } from '../styles'
import { Timer } from './Timer'
import { OldUnistylesBox } from './OldUnistylesBox'

type UnistylesBenchmarkScreenProps = {
    boxes: number,
    onMeasureEnd(renderTime: number): void
}

export const OldUnistylesWithThemeBenchmark: React.FunctionComponent<UnistylesBenchmarkScreenProps> = ({
    boxes,
    onMeasureEnd
}) => (
    <Timer onMeasureEnd={onMeasureEnd}>
        <UnistylesTheme theme={lightTheme}>
            <View style={{ flexDirection: 'row', columnGap: 5 }}>
                {Array.from({ length: boxes }).map((_, index) => (
                    <OldUnistylesBox key={index} />
                ))}
            </View>
        </UnistylesTheme>
    </Timer>
)

