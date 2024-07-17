import React, { useState } from 'react'
import { View, Text, Button, PlatformColor } from 'react-native'
import { StyleSheet, mq } from 'react-native-unistyles'
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

const styles = StyleSheet.create((theme, rt) => {
    const result = {
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
                        // color: 'red'
                    }
                }
            },
            compoundVariants: [
                {
                    size: 'small',
                    bold: true,
                    styles: {
                        color: 'orange'
                    }
                }
            ],
            __unistyles__dependencies_: []
        },
        dynamicText: (paddingLeft: number) => ({
            paddingLeft: rt.insets.bottom + paddingLeft,
            __unistyles__dependencies_: ['$1']
        }),
        empty: {},
        basic: {
            backgroundColor: theme.colors.accent,
            color: PlatformColor('label'),
            transform: [
                {
                    scale: 1
                }
            ],
            shadowOffset: {
                width: 0,
                height: 0
            }
        },
        dynamicFunction: (index: number) => ({
            backgroundColor: index % 2 === 0
                ? theme.colors.accent
                : theme.colors.barbie
        }),
        withVariants: {
            variants: {
                sizes: {
                    primary: {
                        width: {
                            sm: 10,
                            md: 10,
                            lg: 10
                        },
                        height: {
                            sm: 10,
                            md: 10,
                            lg: 10
                        },
                        justifyContent: 'center'
                    }
                },
                colors: {
                    primary: {
                        backgroundColor: PlatformColor('label'),
                        verticalAlign: 'middle'
                    },
                    secondary: {
                        backgroundColor: theme.colors.barbie
                    },
                    default: {
                        backgroundColor: theme.colors.blood
                    }
                }
            }
        },
        nestedProps: {
            transform: [
                {
                    scale: {
                        landscape: 2,
                        portrait: 1,
                        [mq.only.width('sm', 200)]: 3
                    }
                }
            ],
            shadowOffset: {
                width: {
                    sm: 0,
                    md: 0,
                    lg: 0
                },
                height: {
                    sm: 0,
                    md: 0,
                    lg: 0
                }
            },
            textShadowOffset: {
                width: {
                    [mq.only.width('sm', 200)]: 0
                },
                height: {
                    [mq.width('sm').and.height('md')]: 0
                }
            },
            backgroundColor: {
                [mq.only.width('sm', 200)]: theme.colors.accent,
                sm: PlatformColor('label')
            }
        },
        dynamicContainer: (flex: number) => ({
            flex,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: theme.colors.backgroundColor,
            transform: [
                {
                    scale: {
                        xs: 2,
                        md: 1
                    }
                }
            ],
            shadowOffset: {
                width: 1,
                height: {
                    xs: 1,
                    md: 5
                }
            },
            shadowOpacity: 1,
            shadowRadius: 4,
            shadowColor: theme.colors.sky
        }),
        text2: {
            height: 100,
            color: theme.colors.typography,
            transform: [
                {
                    scale: 2
                },
                {
                    translateX: {
                        sm: 10,
                        md: 20
                    }
                }
            ],
            textShadowRadius: 3,
            textShadowColor: theme.colors.oak,
            textShadowOffset: {
                width: 3,
                height: 3
            }
        },
        fontVariantsText: {
            fontVariant: ['tabular-nums', 'small-caps']
        }
    }

    console.log(result)

    return result
})
