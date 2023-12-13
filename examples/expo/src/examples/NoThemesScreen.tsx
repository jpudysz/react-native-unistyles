import React from 'react'
import { View, Text } from 'react-native'
import { createStyleSheet, useStyles } from 'react-native-unistyles'
import { DemoScreen } from '../components'

export const NoThemesScreen: React.FunctionComponent = () => {
    const { styles } = useStyles(stylesheet)

    return (
        <DemoScreen>
            <View style={styles.container}>
                <Text style={styles.text}>
                    This screen has no themes, so it will always be pink.
                </Text>
                <Text style={styles.text}>
                    As you can see you only need to import the `useStyles` hook and the `createStyleSheet` function with no additional setup.
                </Text>
            </View>
        </DemoScreen>
    )
}

const stylesheet = createStyleSheet({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        backgroundColor: '#ff9ff3',
        rowGap: 20
    },
    text: {
        textAlign: 'center'
    }
})
