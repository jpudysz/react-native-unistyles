import { Link } from 'expo-router'
import React from 'react'
// @ts-ignore
import { NativeText } from 'react-native/Libraries/Text/TextNativeComponent'
// @ts-ignore
import View from 'react-native/Libraries/Components/View/ViewNativeComponent'
import { Pressable } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'

export default function HomeScreen() {
    styles.useVariants({
        variant: 'blue'
    })

    return (
        <View style={styles.container}>
            <View style={styles.test}>
                <NativeText style={styles.typography}>
                    Hello world
                </NativeText>
                <Link href="/explore" asChild>
                    <Pressable style={styles.button}>
                        <NativeText style={styles.typography}>
                            Explore
                        </NativeText>
                    </Pressable>
                </Link>
            </View>
        </View>
    )
}

const styles = StyleSheet.create(theme => ({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.backgroundColor
    },
    typography: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.typography
    },
    test: {
        width: '100%',
        variants: {
            variant: {
                red: {
                    backgroundColor: 'red'
                },
                blue: {
                    backgroundColor: 'blue'
                }
            }
        }
    },
    button: {
        backgroundColor: theme.colors.aloes,
        padding: 10,
        borderRadius: 8,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%'
    }
}))
