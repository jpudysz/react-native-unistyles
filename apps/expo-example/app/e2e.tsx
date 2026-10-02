import React, { useEffect } from 'react'
import { Text, View } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { StyleSheet } from 'react-native-unistyles'
import { startRun } from '../e2e'
import { type ScenarioId, SCENARIOS } from '../e2e/protocol'

type Params = {
    scenarios?: string,
    reps?: string,
    seed?: string,
    taps?: string,
    host?: string
}

const parseScenarios = (value = 'all') => {
    if (value === 'all') {
        return [...SCENARIOS]
    }

    return value.split(',').map(id => {
        if (!SCENARIOS.includes(id as ScenarioId)) {
            throw new Error(`Unknown e2e scenario "${id}"`)
        }

        return id as ScenarioId
    })
}

// Deep link: expo-example:///e2e?scenarios=<ids|all>&reps=<n>&seed=<n>[&taps=1][&host=1]
export default function E2EScreen() {
    const params = useLocalSearchParams<Params>()

    useEffect(() => {
        startRun({
            scenarios: parseScenarios(params.scenarios),
            reps: Number(params.reps ?? 1),
            seed: Number(params.seed ?? 1),
            taps: params.taps === '1',
            host: params.host === '1' || params.taps === '1'
        })
    }, [])

    return (
        <View style={styles.container}>
            <Text style={styles.text}>E2E</Text>
        </View>
    )
}

const styles = StyleSheet.create(theme => ({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.background
    },
    text: {
        color: theme.colors.typography
    }
}))
