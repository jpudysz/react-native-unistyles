// #1217 / #1179: logging out unmounts the whole stack while its lower steps are frozen,
// frozen nodes never unlink, so Unistyles must drop their families once React Native releases them
import React from 'react'
import { Text, View } from 'react-native'
import { Stack } from 'expo-router'
import { StyleSheet } from 'react-native-unistyles'
import { Button, churnMemory, session, useIsLoggedIn } from '../../components'
import { useE2EAction } from '../../e2e/actions'

const SignIn = () => (
    <View style={styles.signIn}>
        <Text style={styles.title}>Logged out</Text>
        <Text style={styles.description}>
            The frozen steps were unmounted. Churn memory to free their shadow node families, then log in again.
        </Text>
        <Button testID="session-churn" title="Churn memory" onPress={churnMemory} />
        <Button testID="session-log-in" title="Log in" onPress={session.logIn} />
    </View>
)

export default function SessionLayout() {
    const isLoggedIn = useIsLoggedIn()

    useE2EAction('session.log-out', session.logOut)
    useE2EAction('session.churn', churnMemory)
    useE2EAction('session.log-in', session.logIn)

    if (!isLoggedIn) {
        return <SignIn />
    }

    return (
        <Stack
            screenOptions={{
                headerShown: false,
                freezeOnBlur: true
            }}
        />
    )
}

const styles = StyleSheet.create(theme => ({
    signIn: {
        flex: 1,
        padding: theme.gap(2),
        gap: theme.gap(2),
        backgroundColor: theme.colors.background
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.typography
    },
    description: {
        color: theme.colors.muted
    }
}))
