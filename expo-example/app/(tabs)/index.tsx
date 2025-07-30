import React, { PropsWithChildren } from 'react'
import { Link } from 'expo-router'
import { Pressable, View, Text, SafeAreaView, PlatformColor, Platform, ColorValue } from 'react-native'
import { StyleSheet, UnistylesValue, UnistylesRuntime } from 'react-native-unistyles'

type DynamicProps = {
    width?: UnistylesValue<number>;
    height?: UnistylesValue<number>;
    backgroundColor?: UnistylesValue<ColorValue>;
};

const Dynamic = ({ backgroundColor, height, width, children }: PropsWithChildren<DynamicProps>) => {
    return <View style={styles.dynamic({ backgroundColor, height, width })}>{children}</View>;
};

export default function HomeScreen() {
    styles.useVariants({
        variant: 'blue',
        size: 'md',
    });

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.test}>
                <Text style={styles.typography}>
                    Hello world!
                </Text>
                <Link href="/explore" asChild>
                    <Pressable style={styles.button}>
                        <Text style={styles.typography}>
                            Explore
                        </Text>
                    </Pressable>
                </Link>
                <Pressable onPress={() => UnistylesRuntime.getTheme()}>
                    <Text style={styles.typography}>
                        Press me
                    </Text>
                </Pressable>
            </View>
            <Dynamic width={{ xs: 200, md: 800 }} height={100} backgroundColor={{ xs: 'orange', md: 'green' }}>
                <Text style={styles.typography}>
                    I change at different breakpoints!
                </Text>
                <Text style={styles.typography}>
                    Change size or rotate device to test.
                </Text>
            </Dynamic>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create((theme) => ({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: {
            xs: 'lightgray',
            md:
                Platform.OS === 'web'
                    ? theme.colors.barbie
                    : Platform.select({
                          ios: PlatformColor('systemBlue'),
                          android: PlatformColor('@android:color/holo_green_light'),
                      }),
        },
        shadowOffset: {
            width: 10,
            height: 50,
        },
        transform: [
            {
                rotate: {
                    md: '10',
                },
            },

        ],
        _web: {
            borderBlockStyle: 'dashed',
        },
    },
    typography: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.typography,
    },
    test: {
        width: '100%',
        variants: {
            variant: {
                red: {
                    backgroundColor: 'red',
                },
                blue: {
                    backgroundColor: 'blue',
                },
            },
            size: {
                sm: {
                    height: 50,
                },
                md: {
                    height: 100,
                },
            },
        },
        compoundVariants: [
            {
                variant: 'red',
                size: 'md',
                styles: {
                    borderColor: 'purple',
                },
            },
        ],
    },
    button: {
        backgroundColor: theme.colors.aloes,
        padding: 10,
        borderRadius: 8,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    dynamic: ({ backgroundColor, height, width }: DynamicProps) => ({
        backgroundColor,
        flexDirection: {
            xs: 'column',
            md: 'row',
        },
        height,
        width,
    }),
}));
