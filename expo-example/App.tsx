import React, { useState } from 'react'
import { Button, Text, TouchableOpacity, View } from 'react-native'
import { StyleSheet, UnistylesRuntime } from 'react-native-unistyles'
import './unistyles'

export default function App() {
    const [state, setState] = useState(0)

    return (
        <View style={styles.container}>
            <View style={styles.static}>
                <Text style={styles.staticText}>Static style</Text>
            </View>
            <View style={styles.theme}>
                <Text style={styles.themeText}>Theme based style</Text>
                <View style={styles.themeButtonsContainer}>
                    <Button
                        title='Set dark theme'
                        onPress={() => UnistylesRuntime.setTheme('dark')}
                    />
                    <Button
                        title='Set light theme'
                        onPress={() => UnistylesRuntime.setTheme('light')}
                    />
                    <Button
                        title='Set premium theme'
                        onPress={() => UnistylesRuntime.setTheme('premium')}
                    />
                </View>
            </View>
            <TouchableOpacity
                style={styles.dynamic(state)}
                onPress={() => setState(state + 1)}
            >
                <Text style={styles.whiteText}>
                    {`Dynamic style based on the state: ${state}\n(Press to change the state)`}
                </Text>
            </TouchableOpacity>
            <View style={styles.hover}>
                <Text style={styles.whiteText}>Hover effect style</Text>
            </View>
            <View style={styles.breakpoint}>
                <Text style={styles.whiteText}>Breakpoint based style</Text>
            </View>
        </View>
    )
}

const common = {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
} as const

const styles = StyleSheet.create((theme, rt) => ({
    container: {
        flex: 1,
        display: 'flex'
    },
    static: {
        backgroundColor: 'pink',
        ...common
    },
    staticText: {
        color: 'red',
    },
    theme: {
        backgroundColor: theme.colors.backgroundColor,
        ...common
    },
    themeText: {
        color: theme.colors.typography,
    },
    themeButtonsContainer: {
        marginTop: 20,
        flexDirection: 'row',
        gap: 10
    },
    dynamic: (state: number) => ({
        backgroundColor: state % 2 === 0 ? theme.colors.fog : theme.colors.oak,
        ...common
    }),
    whiteText: {
        color: 'white',
        textAlign: 'center',
    },
    hover: {
        ...common,
        backgroundColor: theme.colors.blood,
        cursor: 'pointer',
        _web: {
            _hover: {
                backgroundColor: theme.colors.sky
            }
        },
    },
    breakpoint: {
        ...common,
        backgroundColor: {
            xs: theme.colors.blood,
            md: theme.colors.sky,
            xl: theme.colors.aloes,
        },
        position: 'relative',
        _web: {
            _after: {
                fontWeight: 'bold',
                content: `"Current breakpoint: ${rt.breakpoint}"`,
                color: 'white',
                position: 'absolute',
                top: '60%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
            }
        },
    }
}))
