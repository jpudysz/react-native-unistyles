import React from 'react'
import { Text, View } from 'react-native'
import { createStyleSheet, useStyles } from 'react-native-unistyles'
import { DemoScreen } from '../components'

export const DefaultVariantScreen: React.FunctionComponent = () => {
    // with no variant specified, the default variant is used
    const { styles } = useStyles(stylesheet)

    return (
        <DemoScreen>
            <View style={styles.container}>
                <Text style={styles.text}>
                    This screen has a box that declares a default variant. The default variant is used when no variant is specified.
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
        color: theme.colors.typography
    },
    box: {
        width: 100,
        height: 100,
        borderRadius: 10,
        variants: {
            colors: {
                default: {
                    backgroundColor: theme.colors.accent
                }
            }
        }
    }
}))
