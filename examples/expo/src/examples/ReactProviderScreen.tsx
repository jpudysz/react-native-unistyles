import React from 'react'
import { ScrollView, Text, View } from 'react-native'
import { createStyleSheet, useStyles, UnistylesProvider, UnistylesRuntime } from 'react-native-unistyles'
import { Button, DemoScreen } from '../components'

type BoxProps = {
    index: number
}

export const ReactProviderScreen: React.FunctionComponent = () => (
    <UnistylesProvider>
        <ReactProviderScreenScreenContent />
    </UnistylesProvider>
)

const Box: React.FunctionComponent<BoxProps> = ({ index }) => {
    const { styles } = useStyles(stylesheet)

    return (
        <View style={styles.box}>
            <Text style={styles.text}>
                {index + 1}
            </Text>
        </View>
    )
}

const ReactProviderScreenScreenContent: React.FunctionComponent = () => {
    const { styles } = useStyles(stylesheet)

    return (
        <DemoScreen>
            <View style={styles.container}>
                <Text style={styles.title}>
                    This screen uses UnistylesProvider that may help if your app have hundreds of useStyles hooks.
                </Text>
                <Text style={styles.title}>
                    Rendering 1000 boxes with 1000 useStyles hooks:
                </Text>
                <ScrollView showsVerticalScrollIndicator={false}>
                    {Array.from({ length: 1000 }).map((_, index) => (
                        <Box
                            key={index}
                            index={index}
                        />
                    ))}
                </ScrollView>
            </View>
            <View style={styles.absolutView}>
                <Button
                    alignCenter
                    title="Change theme"
                    onPress={() => {
                        UnistylesRuntime.themeName === 'light'
                            ? UnistylesRuntime.setTheme('dark')
                            : UnistylesRuntime.setTheme('light')
                    }}
                />
            </View>
        </DemoScreen>
    )
}

const stylesheet = createStyleSheet(theme => ({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        backgroundColor: theme.colors.backgroundColor,
        rowGap: 20
    },
    title: {
        fontSize: 20,
        textAlign: 'center',
        color: theme.colors.typography
    },
    text: {
        textAlign: 'center',
        color: theme.colors.typography
    },
    boxes: {
        flexDirection: 'row'
    },
    box: {
        height: 40,
        width: 40,
        justifyContent: 'center',
        marginBottom: 10,
        backgroundColor: theme.colors.accent
    },
    absolutView: {
        position: 'absolute',
        bottom: 0,
        left: 50,
        right: 50,
        height: 100
    }
}))
