# Setup Guide

## Installation

```bash
npm install react-native-unistyles react-native-nitro-modules
# or
yarn add react-native-unistyles react-native-nitro-modules
```

Then rebuild your native project:
```bash
npx pod-install  # iOS
npx react-native run-android  # Android
```

## Babel Plugin Configuration

The Babel plugin is **mandatory**. It transforms `StyleSheet.create` calls at build time to enable zero-re-render reactivity.

```js
// babel.config.js
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    ['react-native-unistyles/plugin', {
      root: 'src'  // REQUIRED: directory containing your app source code
    }]
  ]
}
```

### Plugin options

| Option | Type | Description |
|--------|------|-------------|
| `root` | `string` | **Required.** Path to your source code root (relative to project root). Only files in this directory are processed. Must NOT resolve to the project root itself. |
| `autoProcessPaths` | `string[]` | Additional directories outside `root` to process (e.g., shared packages in a monorepo). |
| `autoProcessImports` | `string[]` | Additional package names whose imports trigger processing (e.g., `['@myorg/ui']`). |
| `autoRemapImports` | `Record<string, Record<string, string>>` | Map exotic component imports to Unistyles component factories. |
| `debug` | `boolean` | Enable debug logging to see which files are processed. Default: `false`. |

### Example: Monorepo with shared packages

```js
// babel.config.js
module.exports = {
  plugins: [
    ['react-native-unistyles/plugin', {
      root: 'src',
      autoProcessPaths: ['../shared-ui/src'],
      autoProcessImports: ['@myorg/shared-ui']
    }]
  ]
}
```

### React Compiler ordering

If using React Compiler, the Unistyles plugin **MUST come BEFORE** React Compiler:

```js
// babel.config.js
module.exports = {
  plugins: [
    ['react-native-unistyles/plugin', { root: 'src' }],  // FIRST
    'babel-plugin-react-compiler',                         // SECOND
  ]
}
```

## StyleSheet.configure

Call **once** before any component renders. Typically in your app entry point file.

```tsx
import { StyleSheet } from 'react-native-unistyles'
import { lightTheme, darkTheme } from './themes'
import { breakpoints } from './breakpoints'

StyleSheet.configure({
  themes: {
    light: lightTheme,
    dark: darkTheme,
  },
  breakpoints: {
    xs: 0,    // first breakpoint MUST start at 0
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200,
  },
  settings: {
    initialTheme: 'light',
  }
})
```

### Settings options

| Setting | Type | Description |
|---------|------|-------------|
| `initialTheme` | `string \| () => string` | Theme to use on app start. Can be a function for lazy evaluation (e.g., reading from storage). Mutually exclusive with `adaptiveThemes`. |
| `adaptiveThemes` | `boolean` | Auto-switch between `light` and `dark` themes based on OS color scheme. Requires themes named exactly `light` and `dark`. Mutually exclusive with `initialTheme`. |
| `CSSVars` | `boolean` | Use CSS custom properties for theme values on web. Enables instant theme switching without style recalculation. Default: `false`. |
| `nativeBreakpointsMode` | `'pixels' \| 'points'` | Whether breakpoint values are in physical pixels or logical points. Default: device-dependent. |

### Minimal configuration (no themes, no breakpoints)

```tsx
StyleSheet.configure({})
```

Even without themes/breakpoints, `StyleSheet.configure()` must be called to initialize the C++ runtime.

## TypeScript Declarations

Augment the Unistyles module to get type-safe themes and breakpoints:

```tsx
// unistyles.ts (or wherever you call StyleSheet.configure)
import { StyleSheet } from 'react-native-unistyles'
import { lightTheme } from './themes'
import { breakpoints } from './breakpoints'

type AppThemes = {
  light: typeof lightTheme
  dark: typeof lightTheme  // same shape as light
}

type AppBreakpoints = typeof breakpoints

declare module 'react-native-unistyles' {
  export interface UnistylesThemes extends AppThemes {}
  export interface UnistylesBreakpoints extends AppBreakpoints {}
}

StyleSheet.configure({
  themes: { light: lightTheme, dark: darkTheme },
  breakpoints,
})
```

This enables:
- Auto-completion for `theme.colors.*`, `theme.spacing.*`, etc.
- Type-safe breakpoint names in styles and `mq`
- Type-safe theme names in `UnistylesRuntime.setTheme()`

## Expo Router Integration

Expo Router resolves routes before Unistyles can initialize. Extra steps are needed:

### 1. Change the main entry point

```json
// package.json
{ "main": "index.ts" }
```

### 2. Create index.ts

```ts
// index.ts — import config BEFORE the router
import './unistyles'        // your StyleSheet.configure() file
import 'expo-router/entry'
```

### 3. For static rendering (Expo SDK 52+)

Import your Unistyles config in `app/+html.tsx`:

```tsx
// app/+html.tsx
import '../unistyles'  // ensures Unistyles initializes for each static page

import { ScrollViewStyleReset } from 'expo-router/html'
import { type PropsWithChildren } from 'react'

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

## Testing / Mocks Setup

The Babel plugin auto-disables in test environments (`NODE_ENV=test`). Import the mocks file in your Jest setup:

```js
// jest.setup.js
require('react-native-unistyles/mocks')
require('./unistyles')  // your StyleSheet.configure() call — provides theme data to mocks
```

```js
// jest.config.js
module.exports = {
  setupFiles: ['./jest.setup.js'],
}
```

The mock provides:
- `StyleSheet.create` that resolves theme functions using the first registered theme
- `StyleSheet.configure` that stores themes/breakpoints
- `useUnistyles()` returning `{ theme, rt }` with mock runtime values
- `withUnistyles` that applies mapper function
- `mq`, `Display`, `Hide`, `ScopedTheme` as no-ops
- `useAnimatedTheme` and `useAnimatedVariantColor` mocks (from `react-native-unistyles/reanimated`)
