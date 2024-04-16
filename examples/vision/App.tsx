import React, { useState } from 'react'
import { createStyleSheet, useStyles, UnistylesRuntime, mq } from 'react-native-unistyles'
import { Image, Text, View } from 'react-native'
import { BirdsAndStars, DayNight } from './components'
import './styles'
import { Cloud } from './assets'

export const App: React.FunctionComponent = () => {
    const { styles } = useStyles(stylesheet)
    const [isDay, setIsDay] = useState(true)

    return (
        <View style={styles.canvas(isDay)}>
            <Text style={styles.title}>
                Unistyles + visionOS
            </Text>
            <View style={styles.resolutionContainer}>
                <Text style={styles.resolution}>
                    {UnistylesRuntime.screen.width} x {UnistylesRuntime.screen.height}
                </Text>
            </View>
            <DayNight
                onDay={() => setIsDay(true)}
                onNight={() => setIsDay(false)}
            />
            <View style={styles.absolute}>
                <Image
                    source={require('./assets/unicorn.png')}
                    style={styles.unicorn}
                />
                <View style={styles.cloud1}>
                    <Cloud />
                </View>
                <View style={styles.cloud2}>
                    <Cloud />
                </View>
            </View>
            <BirdsAndStars />
        </View>
    )
}

const stylesheet = createStyleSheet(theme => ({
    canvas: (isDay: boolean) => ({
        flex: 1,
        width: '100%',
        backgroundColor: `rgba(0, 0, 0, ${isDay ? 0.3 : 0.7})`
    }),
    cloud1: {
        position: 'absolute',
        bottom: -350,
        left: -250
    },
    cloud2: {
        position: 'absolute',
        bottom: -350,
        right: -250
    },
    unicorn: {
        left: -500,
        bottom: -110,
        width: 1400,
        position: 'absolute',
        resizeMode: 'contain'
    },
    absolute: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0
    },
    title: {
        fontSize: {
            [mq.only.width(0, 1500)]: 60,
            [mq.only.width(1500)]: 80
        },
        fontWeight: 'bold',
        color: theme.colors.typography,
        position: 'absolute',
        top: 500,
        right: 150,
        fontStyle: 'italic'
    },
    resolution: {
        fontSize: 30,
        color: theme.colors.typography
    },
    resolutionContainer: {
        position: 'absolute',
        top: 50,
        left: 50,
        padding: 5,
        paddingHorizontal: 10,
        borderRadius: 12,
        backgroundColor: theme.colors.accent
    }
}))
