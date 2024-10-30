import React, { useRef } from 'react'
import { Button, TextInput, View } from 'react-native'
import { Blurhash } from 'react-native-blurhash'
import { createUnistylesComponent, StyleSheet } from 'react-native-unistyles'
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming
} from 'react-native-reanimated'
import './unistyles'
import { Typography } from './Typography'

const UniButton = createUnistylesComponent(Button, (theme) => ({
    color: theme.colors.test
}))

const UniBlurhash = createUnistylesComponent(Blurhash, () => ({
    style: styles.blurhash()
}))

export const App = () => {
    const [, setCount] = React.useState(0)
    const countRef = useRef(0)
    const rotationAnimation = useSharedValue(0)

    rotationAnimation.value = withRepeat(
        withSequence(withTiming(25, { duration: 150 }), withTiming(0, { duration: 150 })),
        -1
    )

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rotationAnimation.value}deg` }],
    }))

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.animated, animatedStyle]} />
            <Typography isBold isPrimary size="large" isCentered value={1.5}>
                Keyboard insets
            </Typography>
            <Typography isBold={false} size="small" value={2.22}>
                Re-render count: {countRef.current++}
            </Typography>
            <UniBlurhash blurhash="LGFFaXYk^6#M@-5c,1J5@[or[Q6."  />
            <UniButton
                title="Force re-render"
                onPress={() => setCount(prevState =>  prevState + 1)}
            />
            <TextInput style={styles.input} />
        </View>
    )
}

const styles = StyleSheet.create((theme, rt) => ({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-end',
        backgroundColor: theme.colors.backgroundColor,
        paddingHorizontal: theme.gap(2),
        paddingBottom: rt.insets.ime
    },
    secondProp: {
        backgroundColor: theme.colors.backgroundColor
    },
    thirdProp: {
        backgroundColor: rt.isPortrait ? 'blue' : 'green'
    },
    input: {
        height: 50,
        borderWidth: 1,
        width: '100%',
        padding: theme.gap(2),
        borderRadius: theme.gap(1),
        borderColor: theme.colors.typography,
        marginBottom: rt.insets.bottom
    },
    animated: {
        width: 100,
        height: 100,
        opacity: 0.79,
        borderWidth: 1,
        marginBottom: theme.gap(3),
        borderColor: theme.colors.typography,
        backgroundColor: rt.colorScheme === 'dark' ? 'red' : 'blue'
    },
    blurhash: () => ({
        height: 100,
        width: 100,
        borderWidth: 5,
        borderColor: theme.colors.test
    })
}))
