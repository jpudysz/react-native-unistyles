# Setup Guide

## Installation

```bash
npm install react-native-unistyles react-native-nitro-modules@0.37.1
# or
yarn add react-native-unistyles react-native-nitro-modules@0.37.1
```

Always pin an exact `react-native-nitro-modules` version that matches the compatibility table in the Unistyles README (Unistyles 3.4.0+ requires `>= 0.37.1`).

On Android, don't install `react-native-edge-to-edge` (optional since v3.1.0, now deprecated). Set `edgeToEdgeEnabled=true` in `android/gradle.properties` (Expo SDK 54+ does it automatically).

Then rebuild your native project:
```bash
npx pod-install  # iOS
npx react-native run-android  # Android
```

## Babel Plugin Configuration

A build-time integration is **mandatory**: the Babel plugin (default), the experimental [Metro integration](#metro-integration-experimental) (3.6.0+), or the [Re.Pack plugin](#repack). It transforms `StyleSheet.create` calls at build time to enable zero-re-render reactivity.

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
| `root` | `string` | **Required** (the plugin throws without it). Folder resolved relative to Babel's `root` (your project directory by default). **Every file under it is processed**, no matter what it imports. Must NOT resolve to the project root itself (`'.'`), as that would include `node_modules`. |
| `autoProcessImports` | `string[]` | Any file (outside `node_modules`) that imports one of these sources is processed like a `root` file (e.g., `['@my-org/styles']`). Use it for monorepo packages outside `root`. |
| `autoProcessPaths` | `string[]` | Path fragments (matched as a substring of the absolute file path, e.g. `'external-library/components'`) whose `react-native` imports are replaced with Unistyles ref-borrowing factories. Meant for 3rd party code in `node_modules`. `react-native-reanimated/src/component` and `react-native-reanimated/lib/module/component` are always included; your paths are added. |
| `autoRemapImports` | `Array<{ path: string, imports: Array<{ isDefault: boolean, name?: string, path: string, mapTo: string }> }>` | Advanced: remap non-standard imports (e.g. `react-native/Libraries/...`) in a `node_modules` library to Unistyles factories. |
| `debug` | `boolean` | Log detected style dependencies per file/style. Default: `false`. |

The plugin also throws on string refs (`ref="myView"`). Components swapped for ref-borrowing factories: `ActivityIndicator`, `View`, `Text`, `Image`, `ImageBackground`, `KeyboardAvoidingView`, `Pressable`, `ScrollView`, `FlatList`, `SectionList`, `Switch`, `TextInput`, `RefreshControl`, `TouchableHighlight`, `TouchableOpacity`, `VirtualizedList`, `Animated`, `SafeAreaView` (`Modal` and `TouchableWithoutFeedback` are not supported).

### Example: Monorepo with shared packages

```js
// babel.config.js
module.exports = {
  plugins: [
    ['react-native-unistyles/plugin', {
      root: 'src',
      // files outside `root` that import these sources are processed too
      autoProcessImports: ['@my-org/styles', '@my-org/ui'],
      // 3rd party components in node_modules built on react-native views
      autoProcessPaths: ['external-library/components']
    }]
  ]
}
```

Note: `autoProcessPaths` is a substring match against the absolute file path — relative paths like `'../shared-ui/src'` never match.

### Metro integration (experimental)

Since 3.6.0, `react-native-unistyles/metro` is a zero-config alternative to the Babel plugin for apps bundled with Metro (Expo or bare React Native). Wrap the Metro config and **remove** `react-native-unistyles/plugin` from `babel.config.js` — Unistyles throws if both are set up:

```js
// metro.config.js
const { getDefaultConfig } = require('expo/metro-config')
// or for bare React Native: const { getDefaultConfig } = require('@react-native/metro-config')
const { withUnistylesConfig } = require('react-native-unistyles/metro')

module.exports = withUnistylesConfig(getDefaultConfig(__dirname))
// only option: withUnistylesConfig(config, { debug: true }) — same as the Babel plugin's `debug`
```

- No `root`, `autoProcessImports`, `autoProcessPaths` or `autoRemapImports`: every `react-native` import resolves to Unistyles components, **including in `node_modules`**, so 3rd party components that pass `style` to RN views follow theme changes without `withUnistyles` (non-style props like `color` still need it)
- Metro runs the Unistyles Babel transforms on every file that calls `.create(` / `.useVariants(`, also with a `StyleSheet` re-exported from your own module; the output is the same as the Babel plugin's. Files in `node_modules` are transformed only if they import `react-native-unistyles` (libraries built with Unistyles), and Unistyles' own files are skipped
- The bundle contains a single copy of Unistyles
- `withUnistylesConfig` wraps `transformer.babelTransformerPath` and `resolver.resolveRequest`: apply it **last** (or make sure later plugins keep both). It throws if applied twice or if the config has no `babelTransformerPath` (pass the config returned by `getDefaultConfig`)
- To render a raw React Native component, import it from `react-native/index.js` (not swapped)

Limitations:
- Metro only — Re.Pack, Vite, Next.js and other web bundlers keep using the Babel plugin
- Bare RN + `babel-plugin-react-compiler` in `babel.config.js` `plugins`: those run before Metro's plugins, so React Compiler would see `useVariants` first — keep the Babel plugin there. Expo is fine (`babel-preset-expo` adds React Compiler, and presets run after plugins)
- Jest doesn't use Metro, so the [testing setup](#testing--mocks-setup) is unchanged

### Re.Pack

With Re.Pack, don't add the plugin to `babel.config.js`; use the Rspack plugin instead (it runs the same Babel plugin through a loader):

```js
// rspack.config.mjs
import * as Repack from '@callstack/repack'
import { RepackUnistylePlugin } from 'react-native-unistyles/repack-plugin'

export default {
  plugins: [
    new Repack.RepackPlugin(),
    new RepackUnistylePlugin({
      unistylesPluginOptions: { root: 'src' },  // same options as the Babel plugin, `root` required
      // ruleExcludePaths: [...BASE_REPACK_EXCLUDE_PATHS, /my-lib/]  // optional RegExp[]
    })
  ]
}
```

The loader needs `@babel/plugin-syntax-typescript` and `babel-plugin-syntax-hermes-parser` installed in your project.

### React Compiler ordering

If using React Compiler, the Unistyles plugin **MUST come BEFORE** React Compiler (still true in 3.6.0, which made `useVariants` compile with React Compiler):

```js
// babel.config.js
module.exports = {
  plugins: [
    ['react-native-unistyles/plugin', { root: 'src' }],  // FIRST
    'babel-plugin-react-compiler',                         // SECOND
  ]
}
```

## Vite Plugin Configuration

Vite scans dependencies before the Unistyles Babel plugin rewrites React Native component imports. For Vite 6–8, add the Unistyles Vite plugin so those generated deep imports are prebundled in every environment:

```ts
// vite.config.ts
import { unistyles } from 'react-native-unistyles/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [unistyles()],
})
```

The Vite plugin does not replace the mandatory Babel plugin and has no effect on which modules are included in production bundles.

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
| `initialTheme` | `string \| () => string` | Theme to use on app start. Can be a synchronous function (e.g., reading from storage). Mutually exclusive with `adaptiveThemes: true` (throws). With 2+ themes and no `adaptiveThemes`, set it — otherwise no theme is selected. A single registered theme is selected automatically. |
| `adaptiveThemes` | `boolean` | Auto-switch between `light` and `dark` themes based on OS color scheme. Requires themes named exactly `light` and `dark`. While enabled, `UnistylesRuntime.setTheme()` throws — call `setAdaptiveThemes(false)` first. |
| `CSSVars` | `boolean` | Web only. Converts theme strings to CSS variables, so theme switching only swaps the `html` class (or relies on `prefers-color-scheme` with adaptive themes). Default: `true`. Disable when themes differ in non-string values (numbers, functions). |
| `nativeBreakpointsMode` | `'pixels' \| 'points'` | Default `'pixels'`: breakpoints are compared against `UnistylesRuntime.screen` (points on iOS, dp on Android). `'points'` additionally divides the screen size by `pixelRatio`. |

Any other key in `settings` (or in the config object) throws an error.

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
import { lightTheme, darkTheme } from './themes'
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
// index.ts (or index.js)
import 'expo-router/entry'
import './unistyles'        // your StyleSheet.configure() file
```

This is the order used by the official docs and the repo's Expo example app. The key point is that the config file is imported from the custom entry, not from a route file.

Expo Router screens can be frozen when unfocused (`freezeOnBlur`) — Unistyles keeps their bindings and applies changes when they become visible again (fixes for stale styles landed in 3.4.0).

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

The Babel plugin is a no-op when `NODE_ENV === 'test'` (Jest sets this by default). Add the mocks to Jest `setupFiles`, followed by your config file:

```json
// package.json
{
  "jest": {
    "preset": "jest-expo",
    "setupFiles": [
      "react-native-unistyles/mocks",
      "./unistyles.ts"
    ]
  }
}
```

The config file must come **after** the mocks (they stub `StyleSheet.configure`). If `StyleSheet.configure` is called from a design system package, list that package's entry instead (e.g. `"@your-ds/unistyles"`).

Mock behavior and limitations:
- `StyleSheet.create`, `useUnistyles` and `withUnistyles` always resolve with the **first** registered theme (`initialTheme` / `adaptiveThemes` are ignored)
- runtime values (`screen`, `insets`, `statusBar`, `navigationBar`) are `0`
- `variants` / `compoundVariants` are stripped and `useVariants` does nothing
- `Display`, `Hide` and `ScopedTheme` render nothing (`null`)
- `useAnimatedTheme` / `useAnimatedVariantColor` (from `react-native-unistyles/reanimated`) are mocked
- `createUnistylesElement`, `UnistyleDependency` and the SSR helpers are **not** mocked (`undefined`)

Don't unit-test how Unistyles resolves styles — use E2E tools (Maestro, Playwright) for that.
