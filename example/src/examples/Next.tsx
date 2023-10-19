import React from 'react'
import { Text, View, StyleSheet } from 'react-native'

export const Next: React.FunctionComponent = () => {
    // const { styles } = useStyles(stylesheet)

    return (
        <View style={styles.container}>
            <Text>
                Next!
            </Text>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    }
})
