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

## Bundler Integration

A bundler integration is **mandatory**, pick it by bundler:

| Bundler | Integration |
|---------|-------------|
| Metro (Expo, bare React Native) | [Metro integration](#metro-integration) — the default since 3.9.0 |
| Re.Pack, Rspack, Rsbuild | [`UnistylesPlugin`](#repack-rspack-rsbuild) (experimental, 3.9.0+) |
| Next.js, Vite, webpack, other bundlers | [Babel plugin](#babel-plugin-deprecated) — **deprecated** since 3.9.0, no replacement yet, keeps working in 3.x |

The Metro integration and `UnistylesPlugin` have no Babel transform and record StyleSheet dependencies at runtime. The Babel plugin transforms `StyleSheet.create` calls at build time.

### Metro integration

Since 3.6.0, `react-native-unistyles/metro` is the zero-config integration for apps bundled with Metro (Expo or bare React Native), the recommended setup since 3.9.0. Wrap the Metro config, and don't add `react-native-unistyles/plugin` to `babel.config.js` — Unistyles throws if both are set up:

```js
// metro.config.js
const { getDefaultConfig } = require('expo/metro-config')
// or for bare React Native: const { getDefaultConfig } = require('@react-native/metro-config')
const { withUnistylesConfig } = require('react-native-unistyles/metro')

module.exports = withUnistylesConfig(getDefaultConfig(__dirname))
// no options
```

In an Expo app without `metro.config.js`, create it with `npx expo customize metro.config.js`.

- No `root`, `autoProcessImports`, `autoProcessPaths` or `autoRemapImports`: every `react-native` import resolves to Unistyles components, **including in `node_modules`**, so 3rd party components that pass `style` to RN views follow theme changes without `withUnistyles` (non-style props like `color` still need it)
- No Babel transform runs: StyleSheets record their dependencies **at runtime**, from what they read on the mini runtime (`rt.screen` → screen changes, `rt.insets.ime` → keyboard, a StyleSheet function always depends on the theme). Reads behind conditions, in helper functions and in dynamic functions count too. When anything a StyleSheet function reads changes, every style of that StyleSheet is recomputed, but only views whose styles came out different are updated. Reads inside a dynamic function (or a getter) belong to the views that use that style, so read per-frame values like `rt.insets.ime` inside a dynamic function (`keyboard: () => ({ paddingBottom: rt.insets.ime })`), not destructured in the StyleSheet's arguments. The app must install a single copy of `react-native-unistyles`, Metro warns about a second one
- **`useVariants` must use the returned styles**: `const variantStyles = styles.useVariants({ size })`, then `variantStyles.button`. Calling `styles.useVariants()` as a statement does nothing without the Babel plugin (`styles` ignores its variants, also the defaults). The returned form works with the Babel plugin too. Codemod: `npx jscodeshift --parser=tsx --extensions=tsx,ts,jsx,js -t node_modules/react-native-unistyles/codemods/use-variants.js src` (adds semicolons to the changed lines, run the formatter afterwards)
- The bundle contains a single copy of Unistyles
- `withUnistylesConfig` wraps `resolver.resolveRequest`: apply it **last** (or make sure later plugins keep it)
- To render a raw React Native component, import it from `react-native/index.js` (not swapped)
- React Compiler: no plugin order to keep, add it as usual (Expo: `experiments.reactCompiler`)

Limitations:
- Metro only — Re.Pack, Rspack and Rsbuild have [`UnistylesPlugin`](#repack-rspack-rsbuild). Next.js, Vite, webpack and other bundlers have no integration yet and keep the deprecated Babel plugin
- Jest doesn't use Metro, so the [testing setup](#testing--mocks-setup) is unchanged

### Re.Pack, Rspack, Rsbuild

`UnistylesPlugin` (experimental) is the Metro integration for Rspack: the same swaps, runtime dependency tracking and `useVariants` rules as above, no options. It requires `@rspack/core` 1.7.5+, the plugin throws otherwise. Don't add `react-native-unistyles/plugin` to `babel.config.js` (having both throws):

```js
// rspack.config.mjs (Re.Pack)
import * as Repack from '@callstack/repack'
import { UnistylesPlugin } from 'react-native-unistyles/repack-plugin'

export default {
  plugins: [new Repack.RepackPlugin(), new UnistylesPlugin()]
}
```

- Rsbuild (web): `tools: { rspack: { plugins: [new UnistylesPlugin()] } }` with `resolve.alias: { 'react-native': 'react-native-web' }`
- Module Federation: share `react-native-unistyles` and `react-native-unistyles/` (trailing slash, the swapped components) like `react-native` in every container. In Rsbuild use the `moduleFederation` option, not `ModuleFederationPlugin` in `tools.rspack`
- `RepackUnistylePlugin` is deprecated since 3.9.0 (it still works and warns) and will be removed in 4.0. Replace `new RepackUnistylePlugin({ ... })` with `new UnistylesPlugin()`, it takes no options
- Tested with Rspack only, not with Re.Pack's webpack setup (there, the deprecated Babel plugin keeps working in 3.x)

### Migrating from the Babel plugin

1. Add the integration: `withUnistylesConfig` in metro.config.js, or `new UnistylesPlugin()` in the Rspack config
2. Remove `react-native-unistyles/plugin` from `babel.config.js` (and `RepackUnistylePlugin` from the Rspack config). `root`, `autoProcessImports`, `autoProcessPaths` and `debug` aren't needed. Check every `autoRemapImports` rule before removing it: a rule is only safe to remove when the integration swaps the same import to the same component as its `mapTo` (a rule mapping `View` to `NativeView` isn't covered by the `View` swap); the integrations swap only the imports in the table of [repack.mdx "What happens to each import"](https://www.unistyl.es/v3/other/repack#what-happens-to-each-import) (`react-native`, `unstable_NativeView` / `unstable_NativeText`, `ViewNativeComponent`, only `NativeText` of `TextNativeComponent`, and the deep imports of the supported components), and they leave imports made inside `react-native`, `@react-native/*` and `react-native-web` untouched. A rule for anything else (other exports such as `NativeVirtualText`, `react-native/index.js`, a library's own primitive like `@vendor/primitive`) has **no counterpart**: wrap that component with `withUnistyles`; if the rule rewrote a private import inside a library (wrapping can't reach it), patch the library, or stay on the deprecated Babel plugin in 3.x and skip the migration (without the integration: having both throws)
3. Run the `useVariants` codemod (see above), so components use the returned styles
4. Restart the bundler with a clear cache: `npx expo start --clear`, `npx react-native start --reset-cache` or Re.Pack's `--reset-cache`

### Babel plugin (deprecated)

`react-native-unistyles/plugin` is **deprecated since 3.9.0 and removed in 4.0**. It prints a deprecation warning once per bundler process (never under Jest, `NODE_ENV=test`). Use it only with bundlers that have no integration (Next.js, Vite, webpack), where it keeps working in 3.x:

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

#### Plugin options

| Option | Type | Description |
|--------|------|-------------|
| `root` | `string` | **Required** (the plugin throws without it). Folder resolved relative to Babel's `root` (your project directory by default). **Every file under it is processed**, no matter what it imports. Must NOT resolve to the project root itself (`'.'`), as that would include `node_modules`. |
| `autoProcessImports` | `string[]` | Any file (outside `node_modules`) that imports one of these sources is processed like a `root` file (e.g., `['@my-org/styles']`). Use it for monorepo packages outside `root`. |
| `autoProcessPaths` | `string[]` | Path fragments (matched as a substring of the absolute file path, e.g. `'external-library/components'`) whose `react-native` imports are replaced with Unistyles ref-borrowing factories. Meant for 3rd party code in `node_modules`. `react-native-reanimated/src/component` and `react-native-reanimated/lib/module/component` are always included; your paths are added. |
| `autoRemapImports` | `Array<{ path: string, imports: Array<{ isDefault: boolean, name?: string, path: string, mapTo: string }> }>` | Advanced: remap non-standard imports (e.g. `react-native/Libraries/...`) in a `node_modules` library to Unistyles factories. |
| `debug` | `boolean` | Log detected style dependencies per file/style. Default: `false`. |

The plugin also throws on string refs (`ref="myView"`). Components swapped for ref-borrowing factories: `ActivityIndicator`, `View`, `Text`, `Image`, `ImageBackground`, `KeyboardAvoidingView`, `Pressable`, `ScrollView`, `FlatList`, `SectionList`, `Switch`, `TextInput`, `RefreshControl`, `TouchableHighlight`, `TouchableOpacity`, `VirtualizedList`, `Animated`, `SafeAreaView` (`Modal` and `TouchableWithoutFeedback` are not supported).

#### Example: Monorepo with shared packages

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

#### React Compiler ordering

With the Babel plugin, the Unistyles plugin **MUST come BEFORE** React Compiler:

```js
// babel.config.js
module.exports = {
  plugins: [
    ['react-native-unistyles/plugin', { root: 'src' }],  // FIRST
    'babel-plugin-react-compiler',                         // SECOND
  ]
}
```

The Metro integration and `UnistylesPlugin` have no Babel transform, so the order doesn't matter there.

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

After registering, import the derived helper types instead of writing `UnistylesThemes[keyof UnistylesThemes]` by hand:

```typescript
import type { AppTheme, AppThemeName, AppBreakpoint } from 'react-native-unistyles'

const getBorder = (theme: AppTheme) => ({ borderColor: theme.colors.primary })
```

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

Jest doesn't use Metro or Rspack, so the integrations don't run in tests. The deprecated Babel plugin is a no-op when `NODE_ENV === 'test'` (Jest sets this by default) and doesn't warn there. Add the mocks to Jest `setupFiles`, followed by your config file:

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
