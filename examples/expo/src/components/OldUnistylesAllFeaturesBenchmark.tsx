import React from 'react'
import { View } from 'react-native'
import { UnistylesTheme } from 'old-unistyles'
import { lightTheme } from '../styles'
import { Timer } from './Timer'
import { OldUnistylesFullBox } from './OldUnistylesFullBox'

type UnistylesBenchmarkScreenProps = {
    boxes: number,
    onMeasureEnd(renderTime: number): void
}

export const OldUnistylesAllFeaturesBenchmark: React.FunctionComponent<UnistylesBenchmarkScreenProps> = ({
    boxes,
    onMeasureEnd
}) => (
    <Timer onMeasureEnd={onMeasureEnd}>
        <UnistylesTheme theme={lightTheme}>
            <View style={{ flexDirection: 'row', columnGap: 5 }}>
                {Array.from({ length: boxes }).map((_, index) => (
                    <OldUnistylesFullBox
                        key={index}
                        index={index}
                    />
                ))}
            </View>
        </UnistylesTheme>
    </Timer>
)
