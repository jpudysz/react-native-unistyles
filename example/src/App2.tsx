import React, { PropsWithChildren, useState } from "react";
import { Button, Image, Text as RNText, SafeAreaView, ScrollView, View, ViewProps } from "react-native";
import { withUnistyles } from "react-native-unistyles";
import { st } from "../st";
import "../unistyles";

type TextProps = PropsWithChildren & {
    value: number;
    size: "small" | "large";
};

const unicornImage = require("./assets/unicorn.png");

const Text: React.FunctionComponent<TextProps> = ({ value, children, size }) => {
    styles.useVariants({
        size,
    });

    return <RNText style={[styles.text(value), styles.bg1]}>{children}</RNText>;
};

const ComponentA: React.FunctionComponent<ViewProps> = ({ style }) => {
    return <ComponentB style={[styles.bg1, style]} />;
};

const ComponentB: React.FunctionComponent<ViewProps> = ({ style }) => {
    return <View style={[style, { height: 100, width: 100 }]} />;
};

const UniScrollView = withUnistyles(ScrollView);

export const App = () => {
    const [counter, setCounter] = useState(0);

    return (
        <SafeAreaView style={styles.wrapper}>
            <View style={styles.container}>
                <UniScrollView style={styles.scrollView} contentContainerStyle={styles.scrollView}>
                    <Text value={1.1} size="small">
                        Hello world 1
                    </Text>
                    <Text value={1.5} size="small">
                        Hello world 2
                    </Text>
                    <Text value={1} size="large">
                        Hello world 3
                    </Text>
                    <ComponentA style={[{ borderWidth: 5 }, { borderColor: "pink" }]} />

                    <Image source={unicornImage} style={styles.image} />

                    <Button title="Re-render" onPress={() => setCounter(counter + 1)} />
                </UniScrollView>
            </View>
        </SafeAreaView>
    );
};

const styles = st.create((theme, rt) => ({
    wrapper: {
        flex: 1,
    },
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.colors.backgroundColor,
    },
    text: (times: number) => ({
        fontWeight: "bold",
        color: theme.colors.typography,
        variants: {
            size: {
                small: {
                    fontSize: 25 * times,
                },
                large: {
                    fontSize: 50 * times,
                },
            },
        },
    }),
    bg1: {
        backgroundColor: "red",
    },
    scrollView: {
        backgroundColor: theme.colors.backgroundColor,
        gap: 12,
    },
    image: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
}));
