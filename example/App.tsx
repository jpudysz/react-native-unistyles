import React, { useRef } from 'react'
import { Button, Pressable, PressableStateCallbackType, ScrollView, Text, TextInput, View } from 'react-native'
import { Blurhash } from 'react-native-blurhash'
import { createUnistylesComponent, StyleSheet, Display, Hide, mq, UnistylesRuntime } from 'react-native-unistyles'
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

const UniBlurhash = createUnistylesComponent(Blurhash)
const UniScrollView = createUnistylesComponent(ScrollView)

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
            <Display mq={mq.width(0, 400).and.height(700, 1000)}>
                <Text style={styles.text}>
                    👋🏼D
                </Text>
            </Display>
            <Hide mq={mq.only.width('sm', 500)}>
                <Text style={styles.text}>
                    👋🏼H
                </Text>
            </Hide>
            <Typography isBold={false} size="small" value={2.22}>
                Re-render count: {countRef.current++}
            </Typography>
            <UniScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.contentContainerStyle}
            >
                {Array.from({ length: 20 }).map((_, index) => (
                    <View key={index}>
                        <Text style={{ ...index % 2 === 0 ? styles.text : {} }}>{index + 1}</Text>
                    </View>
                ))}
            </UniScrollView>
            <UniBlurhash blurhash="LGFFaXYk^6#M@-5c,1J5@[or[Q6." style={styles.blurhash}  />
            <UniButton
                title="Force re-render"
                onPress={() => setCount(prevState =>  prevState + 1)}
            />
            <Pressable style={styles.pressable} onPress={() => {}}>
                <Typography value={1.1}>
                    Pressable test
                </Typography>
            </Pressable>
            <Pressable style={styles.pressable} onPress={() => {}}>
                <Typography value={1.1}>
                    Pressable test 2
                </Typography>
            </Pressable>
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
        paddingTop: rt.insets.top,
        transform: [
            {
                translateY: rt.insets.ime * -1
            }
        ]
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
        marginBottom: rt.insets.bottom + 10
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
    blurhash: {
        height: 100,
        width: 100,
        borderWidth: 5,
        borderColor: theme.colors.test
    },
    scrollView: {
        width: '100%',
        backgroundColor: theme.colors.accent
    },
    contentContainerStyle: {
        transform: [{
            translateX: rt.colorScheme === 'dark' ? 100 : 200
        }]
    },
    scrollViewText: {
        color: theme.colors.typography
    },
    text: {
        fontSize: 30,
        lineHeight: 40,
        color: theme.colors.typography
    },
    pressable: (state: PressableStateCallbackType) => ({
        backgroundColor: !state.pressed ? theme.colors.accent : theme.colors.backgroundColor,
        marginBottom: rt.insets.bottom
    })
}))
