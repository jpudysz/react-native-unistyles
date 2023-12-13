import React, { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { createStyleSheet, useStyles } from 'react-native-unistyles'
import { DemoScreen } from '../components'

enum ButtonVariant {
    Primary = 'primary',
    Secondary = 'secondary',
    Outlined = 'outlined'
}

export const VariantsScreen: React.FunctionComponent = () => {
    const [buttonVariant, setButtonVariant] = useState(ButtonVariant.Primary)
    // you can pass your variants names to `useStyles` hook, this is optional
    // you can mix variants with media queries and breakpoints
    const { styles } = useStyles(stylesheet, {
        color: buttonVariant
    })

    return (
        <DemoScreen>
            <View style={styles.container}>
                <Text style={styles.text}>
                    This screen has a button and text that react to the selected variant.
                </Text>
                <Text style={styles.text}>
                    Current variant: {buttonVariant}
                </Text>
                <Pressable
                    style={styles.button}
                    onPress={() => {
                        switch (buttonVariant) {
                            case ButtonVariant.Primary:
                                return setButtonVariant(ButtonVariant.Secondary)
                            case ButtonVariant.Secondary:
                                return setButtonVariant(ButtonVariant.Outlined)
                            default:
                            case ButtonVariant.Outlined:
                                return setButtonVariant(ButtonVariant.Primary)
                        }
                    }}
                >
                    <Text style={styles.buttonText}>
                        Change variant
                    </Text>
                </Pressable>
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
        color: theme.colors.typography
    },
    button: {
        variants: {
            color: {
                primary: {
                    backgroundColor: theme.colors.barbie
                },
                secondary: {
                    backgroundColor: theme.colors.accent
                },
                outlined: {
                    backgroundColor: 'transparent'
                },
                default: {
                    backgroundColor: theme.colors.blood
                }
            }
        },
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: theme.colors.typography
    },
    buttonText: {
        variants: {
            color: {
                primary: {
                    color: theme.colors.backgroundColor
                },
                default: {
                    color: {
                        sm: theme.colors.typography,
                        lg: theme.colors.typography
                    }
                }
            }
        },
        fontWeight: 'bold'
    }
}))
