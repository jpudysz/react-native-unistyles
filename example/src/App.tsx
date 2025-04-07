import React, { useRef } from "react";
import {
    Button,
    ImageBackground,
    Pressable,
    PressableStateCallbackType,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { Blurhash } from "react-native-blurhash";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from "react-native-reanimated";
import { Display, Hide, mq, ScopedTheme, StyleSheet, withUnistyles } from "react-native-unistyles";
import "../unistyles";
import { Typography } from "./Typography";

const UniButton = withUnistyles(Button, (theme) => ({
    color: theme.colors.test,
}));

const UniBlurhash = withUnistyles(Blurhash);
const UniScrollView = withUnistyles(ScrollView);

export const App = () => {
    const [, setCount] = React.useState(0);
    const countRef = useRef(0);
    const rotationAnimation = useSharedValue(0);

    rotationAnimation.value = withRepeat(
        withSequence(withTiming(25, { duration: 150 }), withTiming(0, { duration: 150 })),
        -1
    );

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rotationAnimation.value}deg` }],
    }));

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.animated, animatedStyle]} />
            <Typography isBold isPrimary size="large" isCentered value={1.5}>
                Keyboard insets
            </Typography>
            <Display mq={mq.width(0, 400).and.height(700, 1000)}>
                <Text style={styles.text}>👋🏼D</Text>
            </Display>
            <Hide mq={mq.only.width("sm", 500)}>
                <Text style={styles.text}>👋🏼H</Text>
            </Hide>
            <Typography isBold={false} size="small" value={2.22}>
                Re-render count: {countRef.current++}
            </Typography>
            <UniScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainerStyle}>
                {Array.from({ length: 20 }).map((_, index) => (
                    <View key={index}>
                        <Text style={{ ...(index % 2 === 0 ? styles.text : {}) }}>{index + 1}</Text>
                    </View>
                ))}
            </UniScrollView>
            <View style={styles.row}>
                <UniBlurhash blurhash="LGFFaXYk^6#M@-5c,1J5@[or[Q6." style={styles.blurhash} />
                <UniBlurhash
                    blurhash="LGFFaXYk^6#M@-5c,1J5@[or[Q6."
                    style={styles.blurhashWithColor({ light: "#A1CEDC", dark: "#1D3D47" })}
                />
            </View>
            <ImageBackground
                source={{
                    uri: "https://images.unsplash.com/photo-1674448417387-345997fcd888?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwxfDB8MXxyYW5kb218MHx8fHx8fHx8MTY0NjY2ODk0NQ&ixlib=rb-1.2.1&q=80&w=1080",
                }}
                style={styles.imageBackground({ light: "black", dark: "white" })}
            />
            <UniButton title="Force re-render" onPress={() => setCount((prevState) => prevState + 1)} />
            {Array.from({ length: 3 }).map((_, index) => (
                <Pressable
                    key={index}
                    style={(event) => [styles.pressable(event, 1), { marginRight: 10 * index }]}
                    onPress={() => {}}
                >
                    <Typography value={1.1}>Pressable test {index + 1}</Typography>
                </Pressable>
            ))}
            <ScopedTheme name="premium">
                <Text style={styles.scoped}>I'm scoped to premium</Text>
            </ScopedTheme>
            <ScopedTheme name="light">
                <Text style={styles.scopedFn()}>I'm scoped to light</Text>
            </ScopedTheme>
            <TextInput style={styles.input} />
        </View>
    );
};

const styles = StyleSheet.create((theme, rt) => ({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "flex-end",
        backgroundColor: theme.colors.backgroundColor,
        paddingHorizontal: theme.gap(2),
        paddingTop: rt.insets.top,
        transform: [
            {
                translateY: rt.insets.ime * -1,
            },
        ],
    },
    secondProp: {
        backgroundColor: theme.colors.backgroundColor,
    },
    thirdProp: {
        backgroundColor: rt.isPortrait ? "blue" : "green",
    },
    input: {
        height: 50,
        borderWidth: 1,
        width: "100%",
        padding: theme.gap(2),
        borderRadius: theme.gap(1),
        borderColor: theme.colors.typography,
        marginBottom: rt.insets.bottom + 10,
    },
    animated: {
        width: 100,
        height: 100,
        opacity: 0.79,
        borderWidth: 1,
        marginBottom: theme.gap(3),
        borderColor: theme.colors.typography,
        backgroundColor: rt.colorScheme === "dark" ? "red" : "blue",
    },
    blurhash: {
        height: 100,
        width: 100,
        borderWidth: 5,
        borderColor: theme.colors.test,
    },
    blurhashWithColor: (color: Record<string, string>) => ({
        height: 100,
        width: 100,
        borderWidth: 5,
        borderColor: rt.colorScheme === "dark" ? color.dark : color.light,
    }),
    imageBackground: (color: Record<string, string>) => ({
        height: 100,
        width: 100,
        borderWidth: 5,
        borderColor: rt.colorScheme === "dark" ? color.dark : color.light,
    }),
    scrollView: {
        width: "100%",
        backgroundColor: theme.colors.accent,
    },
    row: {
        flexDirection: "row",
    },
    contentContainerStyle: {
        transform: [
            {
                translateX: rt.colorScheme === "dark" ? 100 : 200,
            },
        ],
    },
    scrollViewText: {
        color: theme.colors.typography,
    },
    text: {
        fontSize: 30,
        lineHeight: 40,
        color: theme.colors.typography,
    },
    other: {
        height: 100,
        width: 100,
        backgroundColor: theme.colors.aloes,
    },
    pressable: (event: PressableStateCallbackType, times: number) => ({
        backgroundColor: !event.pressed ? theme.colors.accent : theme.colors.backgroundColor,
        marginBottom: rt.insets.bottom * times,
    }),
    scoped: {
        color: theme.colors.accent,
        backgroundColor: theme.colors.backgroundColor,
    },
    scopedFn: () => ({
        color: theme.colors.accent,
        backgroundColor: theme.colors.backgroundColor,
    }),
}));
