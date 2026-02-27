import React from 'react'
import { Stack } from 'expo-router'

export default function NotFoundScreen() {
    return (
        <Stack.Screen options={{ title: 'Oops!' }} />
    )
}
