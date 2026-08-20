import { Text, View } from 'react-native'

import { CascadeControls } from './CascadeControls'
import { cascadeStyles } from './styles'

export default function CascadePage() {
    return (
        <section>
            <View style={cascadeStyles.card} testID="cascade-server-card">
                <Text>Server-owned card with a persistent RSC stylesheet resource</Text>
            </View>
            <CascadeControls />
            <style>{'.author-cascade-override { border-radius: 27px; }'}</style>
        </section>
    )
}
