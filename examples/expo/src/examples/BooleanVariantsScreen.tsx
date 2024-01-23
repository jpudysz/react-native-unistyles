import React from 'react'
import { Text, View } from 'react-native'
import { createStyleSheet, useStyles } from 'react-native-unistyles'
import { DemoScreen } from '../components'

enum FontSize {
    Small = 'small',
    Medium = 'medium',
    Large = 'large'
}

export const BooleanVariantsScreen: React.FunctionComponent = () => {
    const hasSomeCoolFeatures = true
    const fontSize: FontSize = hasSomeCoolFeatures
        ? FontSize.Large
        : FontSize.Medium

    // you can use boolean to select the variants too!
    const { styles } = useStyles(stylesheet, {
        colors: hasSomeCoolFeatures,
        sizes: !hasSomeCoolFeatures,
        fontSize
    })

    return (
        <DemoScreen>
            <View style={styles.container}>
                <Text style={styles.text}>
                    This screen presents how to select variants using boolean
                </Text>
                <View style={styles.box} />
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
    text: {
        textAlign: 'center',
        color: theme.colors.typography,
        variants: {
            fontSize: {
                small: {
                    fontSize: 12
                },
                medium: {
                    fontSize: 14
                },
                large: {
                    fontSize: 18
                }
            }
        }
    },
    box: {
        borderRadius: 10,
        variants: {
            colors: {
                true: {
                    backgroundColor: theme.colors.barbie
                },
                false: {
                    backgroundColor: theme.colors.blood
                },
                default: {
                    backgroundColor: theme.colors.sky
                },
                other: {
                    backgroundColor: theme.colors.typography
                }
            },
            sizes: {
                true: {
                    width: 200,
                    height: 200
                },
                false: {
                    width: 50,
                    height: 50
                },
                default: {
                    width: 100,
                    height: 100
                },
                other: {
                    width: 150,
                    height: 150
                }
            }
        }
    }
}))
