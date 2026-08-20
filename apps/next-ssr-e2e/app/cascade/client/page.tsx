'use client'

import Link from 'next/link'
import { Text, View } from 'react-native'
import { UnistylesRuntime } from 'react-native-unistyles'

import { cascadeStyles } from '../styles'

export default function CascadeClientPage() {
    return (
        <section>
            <View style={cascadeStyles.card} testID="late-resource-client-card">
                <Text>Client-only owner of the shared hash</Text>
            </View>
            <button type="button" onClick={() => UnistylesRuntime.setTheme('dark')}>
                Switch to dark before navigation
            </button>
            <Link href="/cascade/server">Open late RSC resource</Link>
        </section>
    )
}
