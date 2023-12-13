import React from 'react'
import type { PropsWithChildren } from 'react'
import { View, StyleSheet, Text } from 'react-native'

type DemoGroupProps = {
    title: string
}

export const DemoGroup: React.FunctionComponent<PropsWithChildren<DemoGroupProps>> = ({
    title,
    children
}) => (
    <View style={styles.container}>
        <View style={styles.titleContainer}>
            <Text style={styles.title}>
                {title}
            </Text>
        </View>
        <View style={styles.childrenContainer}>
            {children}
        </View>
    </View>
)

const styles = StyleSheet.create({
    container: {
        marginBottom: 10
    },
    childrenContainer: {
        flexWrap: 'wrap',
        flexDirection: 'row'
    },
    titleContainer: {
        borderWidth: 1,
        borderColor: '#2f3542',
        transform: [
            {
                skewX: '-15deg'
            }
        ],
        paddingLeft: 10
    },
    title: {
        fontWeight: 'bold'
    }
})
