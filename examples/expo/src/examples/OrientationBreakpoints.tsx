import React from 'react'
import { Text, View } from 'react-native'
import { createStyleSheet, useStyles, UnistylesRuntime, ScreenOrientation } from 'react-native-unistyles'
import { DemoScreen } from '../components'

export const OrientationBreakpoints: React.FunctionComponent = () => {
    const { styles } = useStyles(stylesheet)

    return (
        <DemoScreen>
            <View style={styles.container}>
                <Text style={styles.text}>
                    This demo has no registered breakpoints. On mobile Unistyles will provide you two breakpoints:
                </Text>
                <Text>
                    landscape and portrait
                </Text>
                <Text style={styles.text}>
                    The current orientation is: {UnistylesRuntime.orientation === ScreenOrientation.Portrait ? 'portrait' : 'landscape'}
                </Text>
                <Text style={styles.text}>
                    You should see circles on landscape and rectangles on portrait
                </Text>
                <View style={styles.objectContainer}>
                    {Array.from(new Array(10)).map((_, index) => (
                        <View
                            key={index}
                            style={styles.object}
                        />
                    ))}
                </View>
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
    objectContainer: {
        flexDirection: 'row',
        columnGap: 10
    },
    object: {
        width: 40,
        height: 40,
        backgroundColor: theme.colors.accent,
        borderRadius: {
            portrait: undefined,
            landscape: 20
        }
    }
}))
