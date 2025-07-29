import React from 'react'

const [majorReactVersions] = React.version.split('.').map(Number.parseInt)

if (majorReactVersions === undefined || majorReactVersions < 19) {
    throw new Error('Unistyles 🦄: To enable full Fabric power you need to use React 19.0.0 or higher')
}

export { StyleSheet, UnistylesRuntime, StatusBar, NavigationBar } from './specs'
export { mq } from './mq'
export type { UnistylesThemes, UnistylesBreakpoints } from './global'
export { withUnistyles, useUnistyles } from './core'
export type { UnistylesValue, UnistylesVariants } from './types'
export { Display, Hide, ScopedTheme } from './components'
export { useServerUnistyles, hydrateServerUnistyles, getServerUnistyles, resetServerUnistyles } from './server'
