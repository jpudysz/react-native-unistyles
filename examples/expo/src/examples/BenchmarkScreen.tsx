import React  from 'react'
import { Benchmark, UnistylesWithThemeBenchmark, StyleSheetBenchmark } from '../components'

const BOXES = 100

export const BenchmarkScreen: React.FunctionComponent = () => (
    <Benchmark
        times={20}
        boxes={BOXES}
        testDelay={100}
        title={`Init unistyles + rendering ${BOXES} boxes`}
        description={`Single StyleSheet vs ${BOXES}x Unistyles useStyles with single theme`}
        stylesheet={onMeasureEnd => (
            <StyleSheetBenchmark
                boxes={BOXES}
                onMeasureEnd={onMeasureEnd}
            />
        )}
        unistyles={onMeasureEnd => (
            <UnistylesWithThemeBenchmark
                boxes={BOXES}
                onMeasureEnd={onMeasureEnd}
            />
        )}
    />
)
