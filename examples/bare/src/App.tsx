import React from 'react'
import { useStyles, createStyleSheet, UnistylesRuntime } from 'react-native-unistyles'
import { View, Text, Pressable } from 'react-native'
import './styles'
import type { UnistyleText } from '../../../lib/typescript/src'

export const App: React.FunctionComponent = () => {
    const { styles } = useStyles(stylesheet)

    return (
        <View style={styles.container}>
            <Text style={styles.text}>
                Hello
                <Text style={styles.highlight}>
                    {` Bridgeless`}
                </Text>
            </Text>
            <View style={styles.playground}>
                <Text style={styles.note}>
                    <Text style={styles.bold}>
                        {`${UnistylesRuntime.themeName} `}
                    </Text>
                    theme is cool
                </Text>
            </View>
            <Pressable
                style={styles.cta}
                onPress={() => UnistylesRuntime.setTheme(UnistylesRuntime.themeName === 'light' ? 'dark' : 'light')}
            >
                <Text>Switch theme</Text>
            </Pressable>
        </View>
    )
}

const fonts: {bold: UnistyleText} = {
    bold: {
        fontWeight: 'bold'
    }
}

const stylesheet = createStyleSheet((theme, rt) => ({
    container: {
        flex: 1,
        paddingTop: rt.insets.top + 50,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.backgroundColor
    },
    text: {
        fontSize: 20,
        color: theme.colors.typography
    },
    highlight: {
        color: theme.colors.accent,
        ...fonts.bold
    },
    note: {
        color: theme.colors.typography
    },
    playground: {
        flex: 1,
        marginTop: 20
    },
    cta: {
        backgroundColor: theme.colors.accent,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
        borderRadius: 12,
        marginBottom: rt.insets.bottom + 20
    },
    bold: fonts.bold
}))
