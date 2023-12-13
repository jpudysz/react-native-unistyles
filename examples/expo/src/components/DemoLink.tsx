import React from 'react'
import { View, StyleSheet, Text, Pressable } from 'react-native'

type DemoLinkProps = {
    description: string,
    onPress: VoidFunction
}

export const DemoLink: React.FunctionComponent<DemoLinkProps> = ({
    description,
    onPress
}) => (
    <View style={styles.container}>
        <Pressable
            onPress={onPress}
            style={styles.link}
        >
            <Text style={styles.text}>
                {description} →
            </Text>
        </Pressable>
    </View>
)

const styles = StyleSheet.create({
    container: {
        width: '50%',
        padding: 10
    },
    link: {
        justifyContent: 'center'
    },
    text: {
        fontSize: 16,
        lineHeight: 22,
        textDecorationLine: 'underline'
    }
})
