import React from 'react'
import { PlatformColor, Text, View } from 'react-native'
import { StyleSheet, UnistylesRuntime, mq } from 'react-native-unistyles'
import './unistyles'

export const App = () => {
    styles.uni__addVariants({
        size: 'medium'
    })

    return (
        <View style={styles.container}>
            <Text>
                Current breakpoint: {UnistylesRuntime.breakpoint}
            </Text>
        </View>
    )
}

const iterations = 1
const results = []

for (let i = 0; i < iterations; i++) {
    const start = performance.now()
    const styles = StyleSheet.create(theme => ({
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
            },
            uni__dependencies: [2]
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
        text: {
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
    }))
    const end = performance.now()
    results.push(end - start)
}

console.log('Average time taken to create styles: ' + results.reduce((a, b) => a + b, 0) / results.length + 'ms')
