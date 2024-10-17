import React from 'react'
import { Button, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import Animated from 'react-native-reanimated'
import './unistyles'
import { Typography } from './Typography'

export const App = () => {
    const [count, setCount] = React.useState(0)

    return (
        <View style={{...styles.container, ...styles.secondProp, ...styles.thirdProp}}>
            <Animated.View style={styles.animated} />
            <Typography isBold isPrimary size="large" isCentered value={2}>
                Hello World
            </Typography>
            <Typography isBold={false} size="small" value={2.22}>
                Hello World {count}
            </Typography>
            <Button title="Re-render" onPress={() => setCount(prevState =>  prevState + 1)} />
        </View>
    )
}

const styles = StyleSheet.create((theme, rt) => ({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.backgroundColor
    },
    secondProp: {
        marginHorizontal: theme.gap(10),
        backgroundColor: 'red'
    },
    thirdProp: {
        backgroundColor: 'pink'
    },
    animated: {
        width: 100,
        height: 100,
        backgroundColor: rt.colorScheme === 'dark' ? 'red' : 'blue'
    }
}))
