import React, { useState } from 'react'
import { View, Text, Button, PlatformColor } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import type { UnistylesThemes } from 'react-native-unistyles'

const sharedColors = {
    barbie: '#ff9ff3',
    oak: '#1dd1a1',
    sky: '#48dbfb',
    fog: '#c8d6e5',
    aloes: '#00d2d3',
    blood: '#ff6b6b'
}

// todo extend me
StyleSheet.configure({
    settings: {
        adaptiveThemes: false,
        initialTheme: 'dark'
    },
    breakpoints: {
        xs: 0,
        sm: 576,
        md: 768,
        lg: 992,
        xl: 1200,
        superLarge: 2000,
        tvLike: 4000
    },
    themes: {
        light: {
            colors: {
                ...sharedColors,
                backgroundColor: '#ffffff',
                typography: '#000000',
                accent: sharedColors.blood
            }
        },
        dark: {
            colors: {
                ...sharedColors,
                backgroundColor: '#000000',
                typography: '#ffffff',
                accent: sharedColors.barbie
            }
        }
    } as UnistylesThemes
})

const useVariants = (styles, variants) => {
    styles.addVariants(variants)
}

export const App = () => {
    const [isTextHidden, setIsTextHidden] = useState(false)

    useVariants(styles, undefined)

    return (
        <View
            style={styles.container}
            ref={ref => {
                console.log(ref.__nativeTag)
                styles.container.addNode(ref.__nativeTag)

                return () => {
                    styles.container.removeNode(ref.__nativeTag)
                }
            }}
        >
            {!isTextHidden && (
                <Text
                    style={styles.text}
                    ref={ref => {
                        console.log(ref.__nativeTag)
                        console.log(ref._viewConfig.uiViewClassName)
                        styles.text.addNode(ref.__nativeTag)

                        return () => {
                            styles.text.removeNode(ref.__nativeTag)
                        }
                    }}
                >
                    Hello world from RN 0.75
                </Text>
            )}
            <Button title="Toggle text" onPress={() => setIsTextHidden(!isTextHidden)} />
        </View>
    )
}

const styles = StyleSheet.create((theme, rt) => ({
    container: {
        flex: 1,
        justifyContent: {
            xs: 'center',
            md: 'flex-start'
        },
        alignItems: 'center',
        paddingBottom: rt.insets.bottom,
        paddingHorizontal: theme.gap(2),
        __unistyles__dependencies_: ['$0', '$1']
    },
    text: {
        color: PlatformColor('systemTealColor'),
        fontWeight: 'bold',
        variants: {
            size: {
                small: {
                    fontSize: 12
                },
                medium: {
                    fontSize: 14
                },
                large: {
                    fontSize: 18
                }
            },
            bold: {
                true: {
                    fontWeight: 'bold'
                }
            },
            color: {
                default: {
                    color: 'red'
                }
            }
        },
        compoundVariants: [
            {
                size: 'small',
                bold: true,
                styles: {
                    color: theme.colors.barbie
                }
            }
        ],
        __unistyles__dependencies_: ['$0', '$2']
    },
    dynamicText: (paddingLeft: number) => ({
        paddingLeft: rt.insets.bottom + paddingLeft,
        __unistyles__dependencies_: ['$1']
    })
}))
