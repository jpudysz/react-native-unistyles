'use client'

import { Text, View } from 'react-native'
import { UnistylesRuntime } from 'react-native-unistyles'

import { cascadeStyles } from './styles'

export function CascadeControls() {
    return (
        <>
            <View style={cascadeStyles.card} testID="cascade-client-card">
                <Text>Client owner of the shared hash</Text>
            </View>
            <button type="button" onClick={() => UnistylesRuntime.setTheme('dark')}>
                Switch to dark theme
            </button>
        </>
    )
}
