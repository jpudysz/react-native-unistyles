import React  from 'react'
import { Benchmark, StyleSheetBenchmark, UnistylesWithAllFeaturesBenchmark } from '../components'

const BOXES = 100

export const BenchmarkUnistylesAllFeaturesScreen: React.FunctionComponent = () => (
    <Benchmark
        times={20}
        boxes={BOXES}
        testDelay={100}
        title={`Init unistyles + enable/use all features and render ${BOXES} boxes`}
        description={`Single StyleSheet vs ${BOXES}x Unistyles useStyles with all features`}
        stylesheet={onMeasureEnd => (
            <StyleSheetBenchmark
                boxes={BOXES}
                onMeasureEnd={onMeasureEnd}
            />
        )}
        unistyles={onMeasureEnd => (
            <UnistylesWithAllFeaturesBenchmark
                boxes={BOXES}
                onMeasureEnd={onMeasureEnd}
            />
        )}
    />
)
