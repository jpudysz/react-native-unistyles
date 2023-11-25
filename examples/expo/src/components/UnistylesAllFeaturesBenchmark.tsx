import React from 'react'
import { View } from 'react-native'
import { UnistylesRegistry } from 'react-native-unistyles'
import { breakpoints, darkTheme, lightTheme, premiumTheme } from '../styles'
import { Timer } from './Timer'
import { UnistylesFullBox } from './UnistylesFullBox'

UnistylesRegistry
    .addThemes({
        light: lightTheme,
        dark: darkTheme,
        premium: premiumTheme
    })
    .addBreakpoints(breakpoints)
    .addConfig({
        initialTheme: 'light'
    })

type UnistylesBenchmarkScreenProps = {
    boxes: number,
    onMeasureEnd(renderTime: number): void
}

export const UnistylesWithAllFeaturesBenchmark: React.FunctionComponent<UnistylesBenchmarkScreenProps> = ({
    boxes,
    onMeasureEnd
}) => (
    <Timer onMeasureEnd={onMeasureEnd}>
        <View style={{ flexDirection: 'row', columnGap: 5 }}>
            {Array.from({ length: boxes }).map((_, index) => (
                <UnistylesFullBox
                    key={index}
                    index={index}
                />
            ))}
        </View>
    </Timer>
)
