import React from 'react'
import { createStyleSheet, useStyles } from 'react-native-unistyles'
import { SafeAreaView, ScrollView, StatusBar, View, Text } from 'react-native'
import './styles'

export const App: React.FunctionComponent = () => {
    const { styles } = useStyles(stylesheet)

    return (
        <SafeAreaView>
            <StatusBar
                barStyle="dark-content"
                // barStyle={isDarkMode ? 'light-content' : 'dark-content'}
                // backgroundColor={backgroundStyle.backgroundColor}
            />
            <ScrollView
                contentInsetAdjustmentBehavior="automatic"
                style={styles.container}
            >
                <View>
                    <Text>
                        Hello World
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

const stylesheet = createStyleSheet({
    container: {},
    sectionContainer: {
        marginTop: 32,
        paddingHorizontal: 24
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: '600'
    },
    sectionDescription: {
        marginTop: 8,
        fontSize: 18,
        fontWeight: '400'
    },
    highlight: {
        fontWeight: '700'
    }
})
