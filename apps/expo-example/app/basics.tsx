import React, { useState } from 'react'
import {
    ActivityIndicator,
    Image,
    ImageBackground,
    KeyboardAvoidingView,
    Pressable,
    Switch,
    Text,
    TextInput,
    TouchableHighlight,
    TouchableOpacity,
    View
} from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { Screen, Section } from '../components'
import { useE2EAction } from '../e2e/actions'

const logo = require('../assets/images/react-logo.png')

export default function BasicsScreen() {
    const [isOn, setIsOn] = useState(false)

    useE2EAction('basics.toggle', () => setIsOn(value => !value))

    return (
        <Screen>
            <Section title="Theme styles" description="Static, themed and merged styles">
                <View style={styles.row}>
                    <View style={styles.box} />
                    <View style={[styles.box, styles.accentBox]} />
                    <View style={[styles.box, { borderRadius: 24 }]} />
                    <View style={[styles.box, isOn && styles.accentBox]} />
                </View>
                <View style={styles.hairline} />
                <View style={styles.overlayContainer}>
                    <View style={styles.overlay} />
                    <Text style={styles.text}>absoluteFill overlay</Text>
                </View>
                <Text style={styles.text}>
                    Text with a <Text style={styles.bold}>nested bold</Text> and a <Text style={styles.link}>themed link</Text>
                </Text>
                <View style={styles.shadow}>
                    <Text style={styles.text}>boxShadow and transforms</Text>
                </View>
            </Section>
            <Section title="Images">
                <View style={styles.row}>
                    <Image source={logo} style={styles.image} />
                    <ImageBackground source={logo} style={styles.imageBackground} imageStyle={styles.imageBackgroundImage}>
                        <Text style={styles.bold}>Background</Text>
                    </ImageBackground>
                </View>
            </Section>
            <Section title="Inputs">
                <KeyboardAvoidingView style={styles.keyboardAvoidingView}>
                    <TextInput style={styles.input} placeholder="TextInput" defaultValue="Unistyles" />
                </KeyboardAvoidingView>
                <View style={styles.row}>
                    <Switch value={isOn} onValueChange={setIsOn} style={styles.switch} />
                    <ActivityIndicator animating={false} style={styles.spinner} hidesWhenStopped={false} />
                </View>
            </Section>
            <Section title="Touchables">
                <Pressable style={state => styles.pressable(state.pressed)} onPress={() => setIsOn(value => !value)}>
                    <Text style={styles.buttonText}>Pressable with a style function</Text>
                </Pressable>
                <TouchableOpacity style={styles.touchable}>
                    <Text style={styles.buttonText}>TouchableOpacity</Text>
                </TouchableOpacity>
                <TouchableHighlight style={styles.touchable} onPress={() => {}}>
                    <Text style={styles.buttonText}>TouchableHighlight</Text>
                </TouchableHighlight>
            </Section>
        </Screen>
    )
}

const styles = StyleSheet.create(theme => ({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.gap(1)
    },
    box: {
        width: 48,
        height: 48,
        borderRadius: 8,
        backgroundColor: theme.colors.primary,
        borderWidth: 2,
        borderColor: theme.colors.border
    },
    accentBox: {
        backgroundColor: theme.colors.accent
    },
    hairline: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: theme.colors.typography
    },
    overlayContainer: {
        height: 48,
        justifyContent: 'center',
        paddingHorizontal: theme.gap(1)
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 8,
        backgroundColor: theme.colors.chip.subtle
    },
    text: {
        fontSize: 14,
        color: theme.colors.typography
    },
    bold: {
        fontWeight: 'bold',
        color: theme.colors.accent
    },
    link: {
        color: theme.colors.primary,
        textDecorationLine: 'underline',
        textDecorationColor: theme.colors.primary
    },
    shadow: {
        padding: theme.gap(2),
        borderRadius: 8,
        backgroundColor: theme.colors.surface,
        boxShadow: `0 2px 8px ${theme.colors.border}`,
        transform: [{ rotate: '-1deg' }]
    },
    image: {
        width: 48,
        height: 48,
        tintColor: theme.colors.primary
    },
    imageBackground: {
        flex: 1,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.chip.subtle
    },
    imageBackgroundImage: {
        opacity: 0.3,
        tintColor: theme.colors.accent
    },
    keyboardAvoidingView: {
        backgroundColor: theme.colors.background,
        borderRadius: 8
    },
    input: {
        height: 40,
        paddingHorizontal: theme.gap(1),
        borderWidth: 1,
        borderRadius: 8,
        borderColor: theme.colors.border,
        color: theme.colors.typography
    },
    switch: {
        backgroundColor: theme.colors.background
    },
    // no themed props: React Native puts ActivityIndicator's style on a wrapping View,
    // but Unistyles links it with the inner native spinner, so theme changes would miss the wrapper
    spinner: {
        borderRadius: 8,
        padding: theme.gap(1)
    },
    pressable: (isPressed: boolean) => ({
        padding: theme.gap(1.5),
        borderRadius: 8,
        backgroundColor: isPressed ? theme.colors.secondary : theme.colors.primary
    }),
    touchable: {
        padding: theme.gap(1.5),
        borderRadius: 8,
        backgroundColor: theme.colors.secondary
    },
    buttonText: {
        color: theme.colors.chip.onFill,
        fontWeight: '600'
    }
}))
