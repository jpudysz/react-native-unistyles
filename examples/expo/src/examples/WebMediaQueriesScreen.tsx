import React from 'react'
import { Text, View } from 'react-native'
import { mq, createStyleSheet, useStyles } from 'react-native-unistyles'
import { DemoScreen } from '../components'

export const WebMediaQueriesScreen: React.FunctionComponent = () => {
    const { styles } = useStyles(stylesheet)

    return (
        <DemoScreen>
            <View style={styles.container}>
                <Text style={styles.text}>
                    This demo has media queries inserted into the style tag
                </Text>
                <Text style={styles.text}>
                    If you want to see the media queries, open the dev tools and inspect the head tag
                </Text>
                <Text style={styles.text}>
                    This is optional can be enabled with /experimentalCSSMediaQueries/ set to true
                </Text>
                <Text>
                    Rotate or resize the window to see the changes
                </Text>
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
        backgroundColor: {
            [mq.only.width(null, 'md')]: theme.colors.backgroundColor,
            [mq.only.width('md')]: theme.colors.fog
        },
        rowGap: 20
    },
    text: {
        textAlign: 'center',
        color: {
            xs: theme.colors.blood,
            md: theme.colors.backgroundColor
        }
    }
}))
