import React from 'react'
import { View } from 'react-native'
import { UnistylesRegistry } from 'react-native-unistyles'
import { breakpoints, darkTheme, lightTheme, premiumTheme } from '../styles'
import { Timer } from './Timer'
import { UnistylesFullBox } from './UnistylesFullBox'

type UnistylesBenchmarkScreenProps = {
    boxes: number,
    onMeasureEnd(renderTime: number): void
}

export const UnistylesWithAllFeaturesBenchmark: React.FunctionComponent<UnistylesBenchmarkScreenProps> = ({
    boxes,
    onMeasureEnd
}) => {
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

    return (
        <Timer onMeasureEnd={onMeasureEnd}>
            <View style={{ flexDirection: 'row', columnGap: 5 }}>
                {Array.from({ length: boxes }).map((_, index) => (
                    <UnistylesFullBox key={index} />
                ))}
            </View>
        </Timer>
    )
}
