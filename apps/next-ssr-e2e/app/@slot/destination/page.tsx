import { Suspense } from 'react'
import { Text, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'

import { ClientCard } from './ClientCard'
import { LateCard } from './LateCard'

export default function DestinationSlot() {
    return (
        <View style={styles.card} testID="destination-card">
            <Text style={styles.label}>Destination server slot</Text>
            <ClientCard />
            <Suspense fallback={<Text>Loading late server card</Text>}>
                <LateCard />
            </Suspense>
        </View>
    )
}

const styles = StyleSheet.create(theme => ({
    card: {
        backgroundColor: '#654321',
        borderWidth: 7,
        flexDirection: 'row',
        gap: 11,
        padding: 23,
    },
    label: {
        color: theme.colors.text,
        fontSize: 29,
    },
}))
