import React  from 'react'
import { UnistylesBenchmarkScreen } from './UnistylesBenchmarkScreen'
import { StyleSheetBenchmarkScreen } from './StyleSheetBenchmarkScreen'
import { Benchmark } from '../components'

export const BenchmarkScreen: React.FunctionComponent = () => (
    <Benchmark
        title="Init unistyles + rendering 1000 boxes"
        description="Raw StyleSheet vs Unistyles with single theme"
        stylesheet={onMeasureEnd => (
            <UnistylesBenchmarkScreen onMeasureEnd={onMeasureEnd} />
        )}
        unistyles={onMeasureEnd => (
            <StyleSheetBenchmarkScreen onMeasureEnd={onMeasureEnd} />
        )}
    />
)
