import React  from 'react'
import { Benchmark, StyleSheetBenchmark, UnistylesWithAllFeaturesBenchmark } from '../components'

export const BenchmarkUnistylesAllFeaturesScreen: React.FunctionComponent = () => (
    <Benchmark
        times={20}
        title="Init unistyles + enable/use all features and render 1000 boxes"
        description="Raw StyleSheet vs Unistyles with all features"
        stylesheet={onMeasureEnd => (
            <StyleSheetBenchmark onMeasureEnd={onMeasureEnd} />
        )}
        unistyles={onMeasureEnd => (
            <UnistylesWithAllFeaturesBenchmark onMeasureEnd={onMeasureEnd} />
        )}
    />
)
