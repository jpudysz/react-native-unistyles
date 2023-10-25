import React, { useEffect, useState } from 'react'
import { Text, View } from 'react-native'
import { createStyleSheet, useStyles } from '../styles'

const App = () => {
    const [isClient, setIsClient] = useState(false)
    const { styles, breakpoint, theme } = useStyles(stylesheet)

    useEffect(() => setIsClient(true), [])

    return (
        <View style={styles.container}>
            <Text style={styles.text}>
                Welcome to Expo + Next.js + Unistyles 👋
            </Text>
            <Text>
                Current breakpoint: {isClient ? breakpoint : undefined}
            </Text>
            <Text>
                I like {theme.colors.barbie} color
            </Text>
        </View>
    )
}

export default App

const stylesheet = createStyleSheet(theme => ({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: {
            sm: theme.colors.oak,
            md: theme.colors.sky
        }
    },
    text: {
        fontSize: 16,
        color: theme.colors.typography
    }
}))
