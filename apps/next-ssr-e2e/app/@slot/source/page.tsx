import { Text, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'

export default function SourceSlot() {
    return (
        <View style={styles.card} testID="source-card">
            <Text style={styles.label} testID="source-label">
                Source server slot
            </Text>
        </View>
    )
}

const styles = StyleSheet.create(theme => ({
    card: {
        backgroundColor: '#123456',
        borderRadius: 13,
        flexDirection: 'row',
        padding: 17,
    },
    label: {
        color: theme.colors.background,
        fontSize: 19,
        _web: {
            '_first-child': {
                color: '#fedcba',
            },
        },
    },
}))
