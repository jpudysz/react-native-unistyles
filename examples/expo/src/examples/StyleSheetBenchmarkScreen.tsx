import React from 'react'
import { StyleSheet, View } from 'react-native'
import { Timer } from '../components'

type StyleSheetBenchmarkScreenProps = {
    onMeasureEnd(renderTime: number): void
}

export const StyleSheetBenchmarkScreen: React.FunctionComponent<StyleSheetBenchmarkScreenProps> = ({ onMeasureEnd }) => (
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

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        columnGap: 5
    },
    box: {
        backgroundColor: 'red',
        width: 10,
        height: 10
    }
})
