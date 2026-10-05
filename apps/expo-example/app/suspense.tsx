// #1260: content restored by Suspense must keep its own dynamic function arguments, not the ones of the last caller
import React, { Suspense, use, useState } from 'react'
import { Text, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { Button, Screen, Section } from '../components'
import { useE2EAction } from '../e2e/actions'

type Pending = {
    promise: Promise<void>,
    resolve: () => void
}

const createPending = (): Pending => {
    let resolve = () => {}
    const promise = new Promise<void>(onResolve => {
        resolve = onResolve
    })

    return { promise, resolve }
}

const Gate: React.FunctionComponent<{ pending?: Pending }> = ({ pending }) => {
    if (pending) {
        use(pending.promise)
    }

    return null
}

const ITEMS = [0, 1, 2]

export default function SuspenseScreen() {
    const [pending, setPending] = useState<Pending>()

    const suspend = () => setPending(current => current ?? createPending())
    const resume = () => {
        pending?.resolve()
        setPending(undefined)
    }

    useE2EAction('suspense.suspend', suspend)
    useE2EAction('suspense.resume', resume)

    return (
        <Screen>
            <Section title="Suspense boundary" description={pending ? 'Suspended, the content is hidden' : 'Content is visible'}>
                <Suspense fallback={<Text style={styles.fallback}>Loading...</Text>}>
                    <Gate pending={pending} />
                    {ITEMS.map(index => (
                        <View key={index} style={styles.item(index)}>
                            <Text style={styles.itemText(index)}>{`Item ${index}`}</Text>
                        </View>
                    ))}
                </Suspense>
            </Section>
            <Button title="Suspend" onPress={suspend} />
            <Button title="Resume" onPress={resume} />
        </Screen>
    )
}

const styles = StyleSheet.create(theme => ({
    fallback: {
        color: theme.colors.muted
    },
    item: (index: number) => ({
        padding: theme.gap(1.5),
        borderRadius: 8,
        backgroundColor: theme.colors.steps[index]
    }),
    itemText: (index: number) => ({
        color: index === 0 ? theme.colors.typography : theme.colors.chip.onFill,
        alignSelf: index === 2 ? 'flex-end' : 'flex-start'
    })
}))
