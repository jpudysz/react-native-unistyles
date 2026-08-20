import { Text, View } from 'react-native'

import { cascadeStyles } from '../styles'

export default function CascadeServerPage() {
    return (
        <View style={cascadeStyles.card} testID="late-resource-server-card">
            <Text>Server card introduced after the client selected dark</Text>
        </View>
    )
}
