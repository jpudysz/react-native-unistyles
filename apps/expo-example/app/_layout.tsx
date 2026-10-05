import React from 'react'
import { Stack } from 'expo-router'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { useUnistyles } from 'react-native-unistyles'
import { Header } from '../components'
import { screens } from '../consts'
import { E2EOverlay, RuntimeProbe } from '../e2e'

export default function RootLayout() {
    const { theme } = useUnistyles()

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <Stack
                screenOptions={{
                    // every pushed screen freezes the ones below it, like enableFreeze(true)
                    freezeOnBlur: true,
                    header: props => (
                        <Header
                            title={props.options.title ?? props.route.name}
                            canGoBack={Boolean(props.back)}
                        />
                    ),
                    contentStyle: {
                        backgroundColor: theme.colors.background
                    }
                }}
            >
                <Stack.Screen name="index" options={{ title: 'Unistyles' }} />
                {screens.map(screen => (
                    <Stack.Screen
                        key={screen.route}
                        name={screen.route}
                        options={{ title: screen.title }}
                    />
                ))}
                <Stack.Screen name="mount-theme" options={{ title: 'Theme on mount' }} />
                <Stack.Screen name="frozen-list" options={{ title: 'Frozen list' }} />
                <Stack.Screen name="e2e" options={{ title: 'E2E' }} />
            </Stack>
            <E2EOverlay />
            <RuntimeProbe />
        </GestureHandlerRootView>
    )
}
