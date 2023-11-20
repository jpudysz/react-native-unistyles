import React from 'react'
import { View } from 'react-native'
import { Timer } from './Timer'
import { StyleSheetBox } from './StyleSheetBox'

type StyleSheetBenchmarkScreenProps = {
    onMeasureEnd(renderTime: number): void
}

export const StyleSheetBenchmark: React.FunctionComponent<StyleSheetBenchmarkScreenProps> = ({ onMeasureEnd }) => (
    <Timer onMeasureEnd={onMeasureEnd}>
        <View style={{ flexDirection: 'row', columnGap: 5 }}>
            {Array.from({ length: 1000 }).map((_, index) => (
                <StyleSheetBox key={index} />
            ))}
        </View>
    </Timer>
)
