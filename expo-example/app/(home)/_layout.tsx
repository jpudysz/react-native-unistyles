import React from 'react'
import { Stack } from 'expo-router'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

export default function HomeLayout() {
    return (
        <Stack
            screenOptions={{ headerShown: false }}
            initialRouteName="index"
        >
            <Stack.Screen name="index" />
            <Stack.Screen name="hotel" />
        </Stack>
    )
}
