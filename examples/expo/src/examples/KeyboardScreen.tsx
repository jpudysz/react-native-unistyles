import React from 'react'
import { KeyboardAvoidingView, TextInput } from 'react-native'
import { createStyleSheet, useStyles } from 'react-native-unistyles'
import { DemoScreen } from '../components'

export const KeyboardScreen: React.FunctionComponent = () => {
    const { styles } = useStyles(stylesheet)

    return (
        <DemoScreen>
            <KeyboardAvoidingView
                style={styles.container}
                behavior="padding"
            >
                <TextInput
                    placeholder="Type something"
                    style={styles.textInput}
                />
            </KeyboardAvoidingView>
        </DemoScreen>
    )
}

const stylesheet = createStyleSheet((theme, rt) => {
    console.log(rt.insets)

    return {
        container: {
            flex: 1,
            justifyContent: 'flex-end',
            alignItems: 'center',
            paddingHorizontal: 20,
            backgroundColor: theme.colors.backgroundColor,
            rowGap: 20
        },
        textInput: {
            width: '100%',
            height: 50,
            borderWidth: 1,
            borderColor: theme.colors.accent,
            paddingHorizontal: 10,
            marginBottom: rt.insets.bottom + 20
        }
    }
})
