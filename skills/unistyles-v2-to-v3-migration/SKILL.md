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

- React Native 0.78.0+ with New Architecture enabled
- React 19+ (enforced at runtime by Unistyles)
- `react-native-nitro-modules` (native bridge dependency)
- `react-native-edge-to-edge` (required for Android edge-to-edge insets)
- Expo SDK 53+ (if using Expo; not compatible with Expo Go — requires dev client or prebuild)
- Xcode 16+ (iOS)

## Migration Workflow

Follow these steps IN ORDER. Each step must be completed before moving to the next.

### Step 1: Install v3 and configure Babel plugin

Install `react-native-unistyles@3` and add the Babel plugin:

```js
// babel.config.js
module.exports = {
  plugins: [
    ['react-native-unistyles/plugin', { root: 'src' }]  // your app source root
  ]
}
```

The `root` option is REQUIRED. It tells the plugin which directory contains your app code. Files outside this directory (except node_modules paths you explicitly configure) won't be processed.

If using React Compiler, the Unistyles plugin MUST come BEFORE React Compiler in the plugins array.

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
+     adaptiveThemes: true,
+     initialTheme: 'dark'
+   }
+ })
```

**Removed settings:** `plugins`, `experimentalCSSMediaQueries` (now always on), `windowResizeDebounceTimeMs` (no debounce), `disableAnimatedInsets` (insets no longer re-render).

### Step 3: Replace createStyleSheet with StyleSheet.create

```diff
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

**WARNING:** `useUnistyles` causes re-renders when theme/runtime changes. Prefer `withUnistyles` or `StyleSheet.create(theme => ...)` for performance.

### Step 7: Update variant selection

```diff
- const { styles } = useStyles(stylesheet, { size: 'large', color: 'primary' })
+ styles.useVariants({ size: 'large', color: 'primary' })
```

Call `styles.useVariants()` at the top of your component (like a hook). It must be called before accessing styles that use variants.

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

**Renamed/changed methods:**
- `UnistylesRuntime.setImmersiveMode(bool)` replaces separate status bar/nav bar hide
- `UnistylesRuntime.setRootViewBackgroundColor(color)` - no more alpha parameter
- `StyleSheet.hairlineWidth` instead of `UnistylesRuntime.hairlineWidth`

**Removed methods:**
- `addPlugin(plugin)`, `removePlugin(plugin)`, `enabledPlugins`
- `statusBar.setColor(color)`, `navigationBar.setColor(color)`

**New properties on UnistylesRuntime:**
- `statusBar` object with `setHidden(hidden, animation)` and `setStyle(style)`
- `navigationBar` object with `setHidden(hidden)`
- `insets.ime` for keyboard inset

### Step 12: Update TypeScript declarations

```diff
- type AppThemes = { light: typeof lightTheme, dark: typeof darkTheme }
+ type AppThemes = typeof themes  // where themes = { light: lightTheme, dark: darkTheme }

  declare module 'react-native-unistyles' {
    export interface UnistylesThemes extends AppThemes {}
+   export interface UnistylesBreakpoints extends typeof breakpoints {}
  }
```

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

```js
// jest.setup.js
require('react-native-unistyles/mocks')
require('./unistyles.config') // your StyleSheet.configure call
```

The Babel plugin auto-disables in test environments (`NODE_ENV=test`).

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

## Decision Tree: Third-Party Components

When a third-party component needs theme values or Unistyles styles:

1. **Does it accept a `style` prop?** -> Pass Unistyles styles directly (Babel plugin handles it for standard RN components)
2. **Does it need theme-derived non-style props (e.g. `color`)?** -> Wrap with `withUnistyles`
3. **Is it from a library with custom native views?** -> Configure `autoProcessPaths` in Babel plugin
4. **None of the above work?** -> Use `useUnistyles()` hook as fallback

## Critical Rules

1. **NEVER spread styles** - always use array syntax `[styles.a, styles.b]`
2. **Babel plugin is REQUIRED** - without it, styles won't be reactive
3. **Import from `react-native-unistyles`** directly - re-exporting `StyleSheet` from barrel files breaks the Babel plugin
4. **`styles.useVariants()` must be called before accessing styles** in the component render
5. **React 19+ is required** - v3 uses the new React architecture

## Reference Files

- For exhaustive before/after code examples: read [references/migration-patterns.md](references/migration-patterns.md)
- For complete v3 API with all overloads and options: read [references/v3-api-reference.md](references/v3-api-reference.md)
- For troubleshooting errors and known issues: read [references/common-pitfalls.md](references/common-pitfalls.md)
