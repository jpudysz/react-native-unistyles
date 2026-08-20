import { connection } from 'next/server'
import { Image, Pressable, ScrollView, Text, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'

export async function LateCard() {
    await connection()
    await new Promise((resolve) => setTimeout(resolve, 30))

    return (
        <View style={styles.card} testID="late-card">
            <Text style={styles.label}>Late server card</Text>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                horizontal
                style={styles.scroll}
                testID="late-scroll"
            >
                <Text>Styled scroll content</Text>
            </ScrollView>
            <Image
                source={{
                    uri: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="12" height="12"/%3E',
                }}
                style={styles.image}
                testID="late-image"
            />
            <Pressable style={styles.pressable} testID="late-pressable">
                <Text>Server pressable</Text>
            </Pressable>
        </View>
    )
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#246813',
        padding: 9,
    },
    label: {
        color: '#ffffff',
        fontSize: 17,
    },
    scroll: {
        borderColor: '#abcdef',
        borderWidth: 2,
    },
    scrollContent: {
        backgroundColor: '#357924',
        padding: 5,
    },
    image: {
        backgroundColor: '#abcdef',
        height: 12,
        overflow: 'visible',
        width: 12,
        zIndex: 7,
    },
    pressable: {
        backgroundColor: '#765432',
        padding: 4,
    },
})
