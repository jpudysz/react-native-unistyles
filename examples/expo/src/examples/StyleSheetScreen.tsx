import React from 'react'
import { Text, View, StyleSheet } from 'react-native'
import { useStyles } from 'react-native-unistyles'
import { DemoScreen } from '../components'

export const StyleSheetScreen: React.FunctionComponent = () => {
    const { styles } = useStyles(stylesheet)

    return (
        <DemoScreen>
            <View style={styles.container}>
                <Text style={styles.text}>
                    I'm just a minimal example of using StyleSheet
                </Text>
                <Text style={styles.text}>
                    You can incrementally migrate your StyleSheets to Unistyles
                </Text>
            </View>
        </DemoScreen>
    )
}

const stylesheet = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
        paddingHorizontal: 20
    },
    text: {
        marginBottom: 10
    }
})
