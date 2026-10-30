// The keyboard height (rt.insets.ime) read three ways: a StyleSheet (committed to the shadow tree), useUnistyles
// (React) and UnistylesRuntime (native), on the screen and inside a Modal, which on Android gets the keyboard in its own
// window (#810). On the screen a second bar reads it in a getter, which runs only when the style is parsed
import React, { useRef, useState } from 'react'
import { Keyboard, Modal, Text, TextInput, View } from 'react-native'
import { StyleSheet, UnistylesRuntime, useUnistyles } from 'react-native-unistyles'
import { Button, Screen, Section } from '../components'
import { useE2EAction } from '../e2e/actions'
import { sleep } from '../e2e/settle'

type Target = 'screen' | 'modal'
type ViewRef = React.ComponentRef<typeof View>
type TextInputRef = React.ComponentRef<typeof TextInput>

const KEYBOARD_TIMEOUT_MS = 5000
const POLL_MS = 100
// the bar is laid out on the pixel grid
const TOLERANCE = 1
const MODAL_MS = 500

// The value useUnistyles rendered last, kept outside React state, reading it must not re-render
const hookIme: Record<Target, number | undefined> = { screen: undefined, modal: undefined }

const HookReadout: React.FunctionComponent<{ target: Target }> = ({ target }) => {
    const { rt } = useUnistyles()

    hookIme[target] = rt.insets.ime

    return <Text style={styles.readout}>{`useUnistyles ime ${Math.round(rt.insets.ime)}`}</Text>
}

const measureWidth = (view: ViewRef | null) => new Promise<number | undefined>(resolve => {
    if (!view) {
        resolve(undefined)

        return
    }

    view.measure((_x, _y, width) => resolve(width))
})

const isClose = (value: number | undefined, expected: number) => value !== undefined && Math.abs(value - expected) <= TOLERANCE

export default function KeyboardScreen() {
    const [isModalVisible, setIsModalVisible] = useState(false)
    const [isBackgroundModalVisible, setIsBackgroundModalVisible] = useState(false)
    const isModalVisibleRef = useRef(false)
    const onShowRef = useRef<() => void>(undefined)
    const inputs = useRef<Record<Target, TextInputRef | null>>({ screen: null, modal: null })
    const bars = useRef<Record<Target, ViewRef | null>>({ screen: null, modal: null })
    const getterBar = useRef<ViewRef | null>(null)

    const toggleModal = async (isVisible: boolean) => {
        isModalVisibleRef.current = isVisible

        if (isVisible) {
            await new Promise<void>(resolve => {
                onShowRef.current = resolve
                setIsModalVisible(true)
            })
        } else {
            setIsModalVisible(false)
        }

        // Android attaches Unistyles to the Modal's window right after it's shown and detaches it on dismiss
        await sleep(MODAL_MS)
    }

    // StyleSheet, useUnistyles and the native value agree, polled through the keyboard animation
    const expectIme = async (isShown: boolean) => {
        const target: Target = isModalVisibleRef.current ? 'modal' : 'screen'
        const deadline = Date.now() + KEYBOARD_TIMEOUT_MS
        let previous: number | undefined
        let values = { native: 0, styleSheet: undefined as number | undefined, getter: undefined as number | undefined, hook: undefined as number | undefined }

        while (Date.now() < deadline) {
            values = {
                native: UnistylesRuntime.insets.ime,
                styleSheet: await measureWidth(bars.current[target]),
                getter: target === 'screen' ? await measureWidth(getterBar.current) : undefined,
                hook: hookIme[target]
            }

            const expected = isShown ? values.native : 0
            const isSettled = isShown ? values.native > 0 && values.native === previous : values.native === 0
            const isGetterClose = target !== 'screen' || isClose(values.getter, expected)

            if (isSettled && isClose(values.styleSheet, expected) && isGetterClose && isClose(values.hook, expected)) {
                return undefined
            }

            previous = values.native
            await sleep(POLL_MS)
        }

        return {
            styleKey: target,
            prop: 'ime',
            expected: isShown ? 'the keyboard height in native, StyleSheet and useUnistyles (is the software keyboard enabled?)' : '0',
            actual: `native ${values.native} StyleSheet ${values.styleSheet} getter ${values.getter} useUnistyles ${values.hook}`
        }
    }

    useE2EAction('keyboard.focus', () => inputs.current[isModalVisibleRef.current ? 'modal' : 'screen']?.focus())
    useE2EAction('keyboard.dismiss', () => Keyboard.dismiss())
    useE2EAction('keyboard.modal', isVisible => toggleModal(isVisible === 'open'))
    // a Modal below the one with the keyboard, closing it must keep the keyboard height
    useE2EAction('keyboard.background-modal', async isVisible => {
        setIsBackgroundModalVisible(isVisible === 'open')
        await sleep(MODAL_MS)
    })
    useE2EAction('keyboard.shown', () => expectIme(true))
    useE2EAction('keyboard.hidden', () => expectIme(false))

    return (
        <Screen>
            <Section title="Keyboard" description="The bar is as wide as rt.insets.ime">
                <HookReadout target="screen" />
                <View ref={view => { bars.current.screen = view }} style={styles.imeBar} />
                <View ref={view => { getterBar.current = view }} style={getterStyles.imeBar} />
                <TextInput
                    ref={input => { inputs.current.screen = input }}
                    style={styles.input}
                    placeholder="Focus to show the keyboard"
                    placeholderTextColor="gray"
                />
                <Button title="Open Modal" onPress={() => toggleModal(true)} />
            </Section>
            <Modal visible={isBackgroundModalVisible} animationType="none" statusBarTranslucent navigationBarTranslucent>
                <View style={styles.modal} />
            </Modal>
            <Modal
                visible={isModalVisible}
                animationType="none"
                statusBarTranslucent
                navigationBarTranslucent
                onShow={() => onShowRef.current?.()}
                onRequestClose={() => toggleModal(false)}
            >
                <View style={styles.modal}>
                    <HookReadout target="modal" />
                    <View ref={view => { bars.current.modal = view }} style={styles.imeBar} />
                    <TextInput
                        ref={input => { inputs.current.modal = input }}
                        style={styles.input}
                        placeholder="Focus to show the keyboard"
                        placeholderTextColor="gray"
                    />
                    <Button title="Close" onPress={() => toggleModal(false)} />
                </View>
            </Modal>
        </Screen>
    )
}

const styles = StyleSheet.create((theme, rt) => ({
    readout: {
        fontSize: 13,
        color: theme.colors.muted
    },
    imeBar: {
        height: 8,
        width: rt.insets.ime,
        borderRadius: 4,
        backgroundColor: theme.colors.accent
    },
    input: {
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 8,
        padding: theme.gap(1),
        color: theme.colors.typography
    },
    modal: {
        flex: 1,
        paddingTop: rt.insets.top + theme.gap(2),
        paddingHorizontal: theme.gap(2),
        gap: theme.gap(2),
        backgroundColor: theme.colors.background
    }
}))

// rt.insets.ime is read only by the getter, not while the StyleSheet runs
const getterStyles = StyleSheet.create((theme, rt) => ({
    imeBar: {
        height: 8,
        get width() {
            return rt.insets.ime
        },
        borderRadius: 4,
        backgroundColor: theme.colors.primary
    }
}))
