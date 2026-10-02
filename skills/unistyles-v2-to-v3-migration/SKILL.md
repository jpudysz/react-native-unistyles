---
name: unistyles-v2-to-v3-migration
description: >
  Migrate react-native-unistyles from v2 to v3. Triggers on: "migrate unistyles",
  "upgrade unistyles", "v2 to v3", "unistyles migration", "update unistyles",
  "convert unistyles v2". Covers all API changes including StyleSheet.create,
  useStyles removal, theme configuration, variants, withUnistyles, Babel plugin setup,
  style spreading fixes, and third-party component wrapping.
disable-model-invocation: false
user-invocable: true
allowed-tools: Read, Grep, Glob, Edit, Write, Bash(npx *)
---

# Unistyles v2 to v3 Migration Skill

You are migrating a React Native codebase from react-native-unistyles v2 to v3. Follow this workflow precisely. v3 is a complete rewrite with C++ core (Nitro Modules), no re-renders, and a Babel plugin that processes StyleSheets at build time.

## Prerequisites

- React Native 0.81.0+ with New Architecture **mandatory** (enabled by default since RN 0.76, the only architecture since RN 0.82)
- React 19+ (enforced at runtime by Unistyles)
- `react-native-nitro-modules` (native bridge dependency; Unistyles 3.4.0+ requires 0.37.1+)
- `react-native-edge-to-edge` is optional since v3.1.0 (we strongly recommend setting `edgeToEdgeEnabled=true` in `android/gradle.properties`; Expo SDK 54+ enables it automatically)
- Expo SDK 54+ (if using Expo; not compatible with Expo Go — requires dev client or prebuild)
- Xcode 16.4+ (iOS, required by Nitro Modules), iOS 15.1+

## Migration Workflow

Follow these steps IN ORDER. Each step must be completed before moving to the next.

### Step 1: Install v3 and configure Babel plugin

Install v3 together with Nitro Modules, then rebuild the native app (pods / Gradle):

```bash
yarn add react-native-unistyles@3 react-native-nitro-modules@0.37.1  # or npm / bun / pnpm
```

Add the Babel plugin:

```js
// babel.config.js
module.exports = {
  plugins: [
    ['react-native-unistyles/plugin', { root: 'src' }]  // your app source root
  ]
}
```

The `root` option is REQUIRED (the plugin throws without it, and it can't resolve to the project root itself). Every file under `root` is processed, no matter what it imports. Outside `root`, a file is processed only if it imports `react-native-unistyles`, contains an import listed in `autoProcessImports`, or matches `autoProcessPaths` (which always includes the two `react-native-reanimated` component paths; yours are added to them). `node_modules` is ignored unless whitelisted via `autoProcessPaths` / `autoRemapImports`.

If using React Compiler, the Unistyles plugin MUST come BEFORE React Compiler in the plugins array.

If the app is bundled with Re.Pack, don't add the plugin to `babel.config.js` — use `RepackUnistylePlugin` from `react-native-unistyles/repack-plugin` with `unistylesPluginOptions: { root: 'src' }` instead.

### Step 2: Replace UnistylesRegistry with StyleSheet.configure

```diff
- import { UnistylesRegistry } from 'react-native-unistyles'
+ import { StyleSheet } from 'react-native-unistyles'

- UnistylesRegistry
-   .addThemes({ light: lightTheme, dark: darkTheme })
-   .addBreakpoints({ sm: 0, md: 768, lg: 1200 })
-   .addConfig({
-     adaptiveThemes: true,
-     initialTheme: 'dark',
-     plugins: [myPlugin],
-     experimentalCSSMediaQueries: true,
-     windowResizeDebounceTimeMs: 100,
-     disableAnimatedInsets: true
-   })
+ StyleSheet.configure({
+   themes: { light: lightTheme, dark: darkTheme },
+   breakpoints: { sm: 0, md: 768, lg: 1200 },
+   settings: {
+     adaptiveThemes: true // OR initialTheme: 'dark' - never both
+   }
+ })
```

**Removed settings:** `plugins`, `experimentalCSSMediaQueries` (now always on), `windowResizeDebounceTimeMs` (no debounce), `disableAnimatedInsets` (insets no longer re-render).

**v3 `settings` accepts exactly:** `adaptiveThemes`, `initialTheme`, `CSSVars` (web), `nativeBreakpointsMode` (`'pixels'` default | `'points'`). Any other key throws. `initialTheme` together with `adaptiveThemes: true` throws (mutually exclusive), `adaptiveThemes` requires both `light` and `dark` themes, and the first breakpoint must be `0`. Call `StyleSheet.configure` before any `StyleSheet.create` is evaluated (import the config file first in your entry point).

### Step 3: Replace all StyleSheet imports and createStyleSheet

Unistyles `StyleSheet` is a full polyfill of React Native's `StyleSheet` — it includes `hairlineWidth`, `compose`, `flatten`, `absoluteFill`, and `absoluteFillObject`. You should replace **all** `import { StyleSheet } from 'react-native'` with `import { StyleSheet } from 'react-native-unistyles'` so you have a single import.

```diff
- import { StyleSheet } from 'react-native'
- import { createStyleSheet } from 'react-native-unistyles'
+ import { StyleSheet } from 'react-native-unistyles'

- const stylesheet = createStyleSheet(theme => ({
+ const styles = StyleSheet.create(theme => ({
    container: {
      backgroundColor: theme.colors.background
    }
  }))
```

### Step 4: Remove all useStyles hooks

```diff
- import { useStyles } from 'react-native-unistyles'

  const MyComponent = () => {
-   const { styles, theme } = useStyles(stylesheet)
    return <View style={styles.container} />
  }
```

Styles created with `StyleSheet.create` are used directly - no hook needed. The Babel plugin handles reactivity at build time.

Dynamic functions (`styles.box(width, color)`) keep working, but their arguments must be serializable (strings, numbers, booleans, `null`, `undefined`, plain arrays/objects) because Unistyles stores them in C++ and re-runs the function on theme/runtime changes. Functions are dropped and `Date` / `Map` / `Set` / class instances become plain objects — pass precomputed values instead.

### Step 5: Replace useInitialTheme with settings.initialTheme

```diff
- import { useInitialTheme } from 'react-native-unistyles'
-
- const App = () => {
-   useInitialTheme(storage.getString('preferredTheme') ?? 'light')
-   return <Stack />
- }

+ // In your configure call:
+ StyleSheet.configure({
+   settings: {
+     initialTheme: () => storage.getString('preferredTheme') ?? 'light'
+   }
+ })
```

`initialTheme` accepts a string or a synchronous function.

### Step 6: Replace useStyles() for theme access

For components that used `useStyles()` (without a stylesheet) just to get theme/runtime:

**Option A - withUnistyles (preferred for passing theme-derived props):**
```tsx
import { withUnistyles } from 'react-native-unistyles'

const UniButton = withUnistyles(Button, (theme, rt) => ({
  color: theme.colors.primary,
  size: rt.screen.width > 400 ? 'large' : 'small'
}))

// Usage: <UniButton />
```

**Option B - useUnistyles hook (quick migration path):**
```tsx
import { useUnistyles } from 'react-native-unistyles'

const MyComponent = () => {
  const { theme, rt } = useUnistyles()
  return <Text style={{ color: theme.colors.primary }}>{rt.screen.width}</Text>
}
```

**WARNING:** `useUnistyles` re-renders the whole component whenever a `theme` / `rt` value you read changes (subscriptions are created on property access, not on destructuring). Prefer `withUnistyles` or `StyleSheet.create(theme => ...)` for performance. Note that on iOS/Android `withUnistyles` components always re-render on theme change. `withUnistyles` mappings receive the mini runtime, can't return `style` / `contentContainerStyle` (those are mapped automatically), and may return a `key` to force a remount.

### Step 7: Update variant selection

```diff
- const { styles } = useStyles(stylesheet, { size: 'large', color: 'primary' })
+ styles.useVariants({ size: 'large', color: 'primary' })
```

Call `styles.useVariants()` at the top of your component (like a hook). It must be called before accessing styles that use variants. It always expects an object — pass `{}` to select `default` variants; `styles.useVariants(undefined)` throws on iOS/Android. Without a `useVariants` call, variants (including `default`) are ignored.

### Step 8: Fix style spreading (CRITICAL)

v3 styles are C++ proxy objects. Spreading breaks the binding.

```diff
- <View style={{ ...styles.container, ...styles.extra }} />
+ <View style={[styles.container, styles.extra]} />

- <View style={{ ...styles.container, marginTop: 10 }} />
+ <View style={[styles.container, { marginTop: 10 }]} />
```

NEVER use `{...styles.x}`. ALWAYS use `[styles.x, styles.y]` array syntax.

### Step 9: Remove plugins (use static functions in theme instead)

The plugin system is removed. Replace plugins with static functions in your theme or StyleSheet:

```diff
- // Plugin approach (v2)
- const fontPlugin: UnistylesPlugin = {
-   name: 'fontPlugin',
-   onParsedStyle: (_key, styles) => {
-     if ('fontWeight' in styles) {
-       styles.fontFamily = styles.fontWeight === 'bold' ? 'Roboto-Bold' : 'Roboto-Regular'
-     }
-     return styles
-   }
- }

+ // v3: Use a helper function in your theme or directly
+ const styles = StyleSheet.create(theme => ({
+   text: {
+     fontFamily: theme.utils.getFontFamily('bold')
+   }
+ }))
```

### Step 10: Remove UnistylesProvider

`UnistylesProvider` no longer exists. Simply remove it from your component tree.

### Step 11: Update UnistylesRuntime usage

**Renamed/changed methods** (follow the TypeScript types for the rest):
- `UnistylesRuntime.setRootViewBackgroundColor(color?)` - no more alpha parameter; accepts any React Native color, omit it to reset to transparent
- `StyleSheet.hairlineWidth` instead of `UnistylesRuntime.hairlineWidth`

**Removed methods:**
- `addPlugin(plugin)`, `removePlugin(plugin)`, `enabledPlugins`
- `statusBar.setColor(color)`, `navigationBar.setColor(color)` (Android 15 deprecation)

**v3 system bar / inset API on UnistylesRuntime:**
- `statusBar.setHidden(hidden, animation?)` - `animation` is `'none' | 'fade' | 'slide'` (used on iOS)
- `statusBar.setStyle(style, animated?)` - `style` is the `StatusBarStyle` enum (`StatusBarStyle.Default | Light | Dark`, exported from `react-native-unistyles`)
- `navigationBar.setHidden(hidden)` - Android only (navigation bar dimensions are always `0` on iOS)
- `setImmersiveMode(enabled)` - hides status + navigation bars on Android, only the status bar on iOS
- `insets.ime` for keyboard inset

Access system bars only through `UnistylesRuntime.statusBar` / `UnistylesRuntime.navigationBar` — there are no standalone status/navigation bar exports.

### Step 12: Update TypeScript declarations

```diff
- type AppThemes = { light: typeof lightTheme, dark: typeof darkTheme }
+ type AppThemes = typeof themes  // where themes = { light: lightTheme, dark: darkTheme }
+ type AppBreakpoints = typeof breakpoints

  declare module 'react-native-unistyles' {
    export interface UnistylesThemes extends AppThemes {}
+   export interface UnistylesBreakpoints extends AppBreakpoints {}
  }
```

`interface X extends typeof y` is not valid TypeScript — always go through a type alias. Useful v3 exports: enums `ColorScheme`, `Orientation`, `StatusBarStyle`, `IOSContentSizeCategory`, `AndroidContentSizeCategory`, `WebContentSizeCategory`, and types `UnistylesVariants`, `UnistylesMiniRuntime`.

### Step 13: Update keyboard/IME handling

```diff
- import { useAnimatedKeyboard } from 'react-native-reanimated'
- const keyboard = useAnimatedKeyboard()

+ // Use ime inset in StyleSheet
+ const styles = StyleSheet.create((theme, rt) => ({
+   container: {
+     paddingBottom: rt.insets.ime
+   }
+ }))
```

### Step 14: Set up testing mocks

```json
// package.json (or jest.config.js)
{
  "jest": {
    "setupFiles": [
      "react-native-unistyles/mocks",
      "./unistyles.ts"
    ]
  }
}
```

The config file (your `StyleSheet.configure` call) must come AFTER the mocks. The Babel plugin is a no-op when `NODE_ENV=test` (Jest's default). Mocks always use the first registered theme, report `0` for runtime dimensions/insets, strip variants, and render nothing for `Display` / `Hide` / `ScopedTheme` — don't assert on resolved styles.

## Expo Router Integration

If the project uses Expo Router, extra steps are needed because Expo Router resolves routes before Unistyles can initialize.

**1. Change the main entry point** in `package.json`:

```json
{ "main": "index.ts" }
```

**2. Create `index.ts`** that imports Unistyles config before the router:

```ts
import 'expo-router/entry'
import './unistyles' // your StyleSheet.configure() file
```

**3. For static rendering (Expo SDK 52+):** import the Unistyles config in `+html.tsx` as well:

```tsx
import '../unistyles' // ensures Unistyles initializes for each static page

import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
// The contents of this function only run in Node.js environments and
// do not have access to the DOM or browser APIs.
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        {/*
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native.
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />

        {/* Add any additional <head> elements that you want globally available on web... */}
      </head>
      <body>{children}</body>
    </html>
  );
}
```

See https://www.unistyl.es/v3/guides/expo-router for full details.

## Quick Reference: v2 API to v3

| v2 | v3 |
|----|-----|
| `createStyleSheet` | `StyleSheet.create` |
| `useStyles(stylesheet)` | Use `styles` directly (no hook) |
| `useStyles()` for theme | `useUnistyles()` or `withUnistyles` |
| `useStyles(ss, variants)` | `styles.useVariants(variants)` |
| `useInitialTheme(name)` | `settings.initialTheme` in configure |
| `UnistylesRegistry.addThemes()` | `StyleSheet.configure({ themes })` |
| `UnistylesRegistry.addBreakpoints()` | `StyleSheet.configure({ breakpoints })` |
| `UnistylesRegistry.addConfig()` | `StyleSheet.configure({ settings })` |
| `UnistylesProvider` | Removed (not needed) |
| `UnistylesPlugin` | Removed (use theme functions) |
| `{...styles.x, ...styles.y}` | `[styles.x, styles.y]` |
| `UnistylesRuntime.hairlineWidth` | `StyleSheet.hairlineWidth` |
| `statusBar.setColor()` | Removed |
| `navigationBar.setColor()` | Removed |
| `import { StyleSheet } from 'react-native'` | `import { StyleSheet } from 'react-native-unistyles'` (full polyfill) |

## Decision Tree: Third-Party Components

When a third-party component needs theme values or Unistyles styles:

1. **Is it a `react-native` / `react-native-reanimated` component with a `style` prop?** -> Pass Unistyles styles directly, nothing else needed
2. **Is it a `react-native` component with `contentContainerStyle`?** -> Wrap with `withUnistyles` (auto-maps `style` and `contentContainerStyle`)
3. **Is it a third-party component that uses `react-native` components internally?** -> Whitelist it with `autoProcessPaths` (or `autoRemapImports` for non-standard imports) in the Babel plugin
4. **Does it need theme-derived non-style props (e.g. `color`), or did step 3 fail?** -> Wrap with `withUnistyles`
5. **None of the above work?** -> Use `useUnistyles()` hook as fallback

## Critical Rules

1. **New Architecture is mandatory** - it's enabled by default since RN 0.76 and is the only architecture since RN 0.82; on RN 0.81 make sure you haven't opted out
2. **NEVER spread styles** - always use array syntax `[styles.a, styles.b]`
3. **Babel plugin is REQUIRED** - without it, styles won't be reactive
4. **Import `StyleSheet` from `react-native-unistyles` only** - it polyfills all RN StyleSheet APIs (`hairlineWidth`, `compose`, `flatten`, `absoluteFill`, etc.), so remove any `import { StyleSheet } from 'react-native'`
5. **Prefer importing `StyleSheet` directly from `react-native-unistyles`** - if you re-export it from your own package/alias (e.g. `@myorg/design-system`), files outside `root` that use it must be listed via `autoProcessImports`
6. **`styles.useVariants({...})` must be called before accessing styles** in the component render (always with an object)
7. **React 19+ is required** - Unistyles throws at import time on older React versions
8. **Never `initialTheme` + `adaptiveThemes: true`** together - `StyleSheet.configure` throws

## Reference Files

- For exhaustive before/after code examples: read [references/migration-patterns.md](references/migration-patterns.md)
- For complete v3 API with all overloads and options: read [references/v3-api-reference.md](references/v3-api-reference.md)
- For troubleshooting errors and known issues: read [references/common-pitfalls.md](references/common-pitfalls.md)
