import React from 'react'
import { Text, View } from 'react-native'
import { router } from 'expo-router'
import { StyleSheet } from 'react-native-unistyles'
import { Button } from './Button'
import { session } from './session'

type StepProps = {
    step: number
}

const STEPS = 3

// Every step calls the same dynamic functions with its own index (#1262)
export const Step: React.FunctionComponent<StepProps> = ({ step }) => (
    <View style={styles.container(step)}>
        <View style={styles.card(step)}>
            <Text style={styles.title(step)}>{`Step ${step}`}</Text>
            <Text style={styles.description}>
                Steps below this one are frozen. Each one must keep its own color when it comes back.
            </Text>
        </View>
        {step < STEPS ? (
            <Button testID={`step-${step}-next`} title="Next step" onPress={() => router.push(`/session/step-${step + 1}`)} />
        ) : (
            <Button testID="session-log-out" title="Log out (unmounts frozen steps)" onPress={session.logOut} />
        )}
    </View>
)

const styles = StyleSheet.create(theme => ({
    container: (step: number) => ({
        flex: 1,
        padding: theme.gap(2),
        gap: theme.gap(2),
        backgroundColor: theme.colors.background,
        alignItems: step === 2 ? 'center' : 'stretch'
    }),
    card: (step: number) => ({
        padding: theme.gap(2),
        borderRadius: 12,
        borderWidth: 2,
        borderColor: theme.colors.steps[step - 1],
        backgroundColor: theme.colors.surface
    }),
    title: (step: number) => ({
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.steps[step - 1],
        textAlign: step === 3 ? 'right' : 'left'
    }),
    description: {
        color: theme.colors.muted
    }
}))
