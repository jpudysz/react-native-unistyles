import React from 'react'
import { Text, View } from 'react-native'
import { Variants, StyleSheet, createUnistylesElement } from 'react-native-unistyles'

const UniView = createUnistylesElement(View)

// Before
// export default function HomeScreen() {
//     styles.useVariants({
//         variant: 'blue'
//     })
//     return (
        // <View style={styles.container}>
        //     <UniView style={styles.test}>
        //         <Text>
        //             Hello world
        //         </Text>
        //     </UniView>
        // </View>
//     )
// }

export default function HomeScreen() {
    return (
        <Variants variants={{ variant: 'blue' }}>
            <UniView style={styles.container}>
                <UniView style={styles.test}>
                    <Text>
                        Hello world
                    </Text>
                </UniView>
            </UniView>
        </Variants>
    )
}

const styles = StyleSheet.create(theme => ({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.backgroundColor
    },
    test: {
        width: 100,
        height: 100,
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
    }
// @ts-ignore
}), 100)
