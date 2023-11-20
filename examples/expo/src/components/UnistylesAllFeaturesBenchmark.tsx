import React from 'react'
import { View } from 'react-native'
import { UnistylesRegistry } from 'react-native-unistyles'
import { breakpoints, darkTheme, lightTheme, premiumTheme } from '../styles'
import { Timer } from './Timer'
import { UnistylesFullBox } from './UnistylesFullBox'

type UnistylesBenchmarkScreenProps = {
    onMeasureEnd(renderTime: number): void
}

export const UnistylesWithAllFeaturesBenchmark: React.FunctionComponent<UnistylesBenchmarkScreenProps> = ({ onMeasureEnd }) => {
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
                {Array.from({ length: 1000 }).map((_, index) => (
                    <UnistylesFullBox key={index} />
                ))}
            </View>
        </Timer>
    )
}
