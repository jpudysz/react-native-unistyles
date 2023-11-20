import React  from 'react'
import { Benchmark, UnistylesWithThemeBenchmark, StyleSheetBenchmark } from '../components'

export const BenchmarkScreen: React.FunctionComponent = () => (
    <Benchmark
        times={20}
        title="Init unistyles + rendering 1000 boxes"
        description="Single StyleSheet vs 1000x Unistyles useStyles with single theme"
        stylesheet={onMeasureEnd => (
            <StyleSheetBenchmark onMeasureEnd={onMeasureEnd} />
        )}
        unistyles={onMeasureEnd => (
            <UnistylesWithThemeBenchmark onMeasureEnd={onMeasureEnd} />
        )}
    />
)
