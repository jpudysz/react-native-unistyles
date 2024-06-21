import React from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { View, Text, StatusBar } from 'react-native'
import * as NavigationBar from 'expo-navigation-bar'
import { UnistylesRuntime, createStyleSheet, useStyles } from 'react-native-unistyles'
import { Button, DemoScreen } from '../components'

export const LayoutScreen: React.FunctionComponent = () => {
    const { styles, theme } = useStyles(stylesheet)
    const { top, bottom, left, right } = useSafeAreaInsets()
    const { insets } = UnistylesRuntime

    return (
        <DemoScreen>
            <View style={styles.container}>
                <View style={styles.row}>
                    <Text style={styles.text(true)}>
                        Unistyles insets:
                    </Text>
                    <Text style={styles.text(false)}>
                        T:{insets.top} B:{insets.bottom} R:{insets.right} L:{insets.left}
                    </Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.text(true)}>
                        SafeArea insets:
                    </Text>
                    <Text style={styles.text(false)}>
                        T:{top} B:{bottom} R:{right} L:{left}
                    </Text>
                </View>
                <View style={styles.column}>
                    <Button
                        title="Hide status bar with Unistyles"
                        onPress={() => UnistylesRuntime.statusBar.setHidden(true)}
                    />
                    <Button
                        title="Hide status bar with React Native"
                        onPress={() => StatusBar.setHidden(true)}
                    />
                    <Button
                        color={theme.colors.barbie}
                        title="Hide navigation bar with Unistyles"
                        onPress={() => UnistylesRuntime.navigationBar.setHidden(true)}
                    />
                    <Button
                        color={theme.colors.barbie}
                        title="Hide navigation bar with Expo"
                        onPress={() => NavigationBar.setVisibilityAsync('hidden').catch(() => {})}
                    />
                    <Button
                        color={theme.colors.aloes}
                        title="Enter immersive mode with Unistyles"
                        onPress={() => UnistylesRuntime.setImmersiveMode(true)}
                    />
                    <View style={styles.divider} />
                    <Button
                        color={theme.colors.typography}
                        title="Reset"
                        onPress={() => UnistylesRuntime.setImmersiveMode(false)}
                    />
                </View>
            </View>
            <View style={styles.safeAreaInsets(top, bottom, left, right)} />
            <View style={styles.unistylesInsets} />
        </DemoScreen>
    )
}

const stylesheet = createStyleSheet((theme, runtime) => ({
    container: {
        flex: 1,
        paddingTop: 50,
        paddingHorizontal: 20,
        backgroundColor: theme.colors.backgroundColor
    },
    unistylesInsets: {
        pointerEvents: 'none',
        position: 'absolute',
        top: runtime.insets.top,
        bottom: runtime.insets.bottom,
        left: runtime.insets.left,
        right: runtime.insets.right,
        borderWidth: 1,
        borderColor: theme.colors.accent
    },
    safeAreaInsets: (top: number, bottom: number, left: number, right: number) => ({
        top,
        bottom,
        left,
        right,
        position: 'absolute',
        borderWidth: 1,
        borderColor: theme.colors.aloes,
        pointerEvents: 'none'
    }),
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center'
    },
    title: {
        fontSize: 20,
        marginBottom: 30,
        fontWeight: 'bold',
        textAlign: 'center',
        color: theme.colors.accent
    },
    text: (bold: boolean) =>({
        fontSize: 16,
        flex: 1,
        color: theme.colors.typography,
        textAlign: 'center',
        fontWeight: bold ? 'bold' : 'normal'
    }),
    column: {
        rowGap: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20
    },
    divider: {
        width: '100%',
        height: 1,
        backgroundColor: theme.colors.accent
    }
}))
