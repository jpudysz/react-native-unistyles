# Common Pitfalls & Troubleshooting

Known issues and solutions gathered from GitHub issues and migration experiences.

---

## 1. Babel Plugin Not Configured / Wrong Root

**Symptom:** Styles don't react to theme/breakpoint changes. Everything renders but nothing updates.

**Error (when `root` is missing):**
```
Unistyles 🦄: Babel plugin requires `root` option to be set.
```

**Error (when `root` resolves to project root):**
```
Unistyles 🦄: Root option can't resolve to project root as it will include node_modules folder.
```

**Fix:** Ensure `root` points to your app source directory (e.g., `'src'` or `'app'`), NOT the project root:

```js
// babel.config.js
module.exports = {
  plugins: [
    ['react-native-unistyles/plugin', { root: 'src' }]
  ]
}
```

After changing babel config, clear the Metro cache:
```bash
npx react-native start --reset-cache
# or for Expo:
npx expo start --clear
```

---

## 2. Re-exporting StyleSheet from Barrel Files / Packages

**Symptom:** Styles don't update reactively in some files. The Babel plugin doesn't process them.

**Cause:** Every file under `root` is processed regardless of imports. Outside `root`, the plugin only processes files that import from `react-native-unistyles` (or match `autoProcessImports` / `autoProcessPaths`). A file outside `root` that gets `StyleSheet` through a re-export isn't detected:

```tsx
// packages/design-system/index.ts
export { StyleSheet } from 'react-native-unistyles'

// ❌ packages/feature/Screen.tsx (outside root)
import { StyleSheet } from '@myorg/design-system'  // Plugin won't process this file
```

**Fix:** Prefer importing directly from `react-native-unistyles`:

```tsx
// ✅ GOOD
import { StyleSheet } from 'react-native-unistyles'
```

If you need to keep importing from a custom package/alias, whitelist it with `autoProcessImports`:

```js
['react-native-unistyles/plugin', {
  root: 'src',
  autoProcessImports: ['@myorg/design-system']
}]
```

---

## 3. "Style is not bound!" Error (Style Spreading)

**Symptom:** Runtime error `Unistyles: Style is not bound!`, or the `__DEV__` warning `Unistyles: we detected style object with N unistyles styles. This might cause no updates or unpredictable behavior...`.

**Cause:** Spreading Unistyles styles breaks C++ proxy bindings:

```tsx
// ❌ CAUSES ERROR
<View style={{ ...styles.container }} />
<View style={{ ...styles.a, ...styles.b }} />
<View style={Object.assign({}, styles.container)} />
```

**Fix:** Use array syntax exclusively:

```tsx
// ✅ CORRECT
<View style={styles.container} />
<View style={[styles.a, styles.b]} />
<View style={[styles.container, { marginTop: 10 }]} />
<View style={[styles.base, isActive && styles.active]} />
```

This also applies inside `useAnimatedStyle` when combining with Reanimated:

```tsx
// ❌ BAD
const animatedStyle = useAnimatedStyle(() => ({
  ...styles.container,  // NEVER spread Unistyles styles in animated callbacks
  opacity: opacity.value
}))

// ✅ GOOD - keep them separate in the array
<Animated.View style={[styles.container, animatedStyle]} />
```

---

## 4. Theme Not Updating in Separate Files

**Symptom:** Theme changes via `UnistylesRuntime.setTheme()` update some components but not others.

**Cause:** The Babel plugin processes every file under the configured `root` directory, but outside it only files that import `react-native-unistyles` (or match `autoProcessImports` / `autoProcessPaths`). A component file outside `root` that only imports styles from another file (no Unistyles import) keeps plain `react-native` components, so its views can't be updated from C++.

**Fix:**
1. Ensure your components and `StyleSheet.create` files are under the `root` directory
2. For files in other directories, whitelist them via `autoProcessImports` (by import) or `autoProcessPaths` (matched as a substring of the file path):

```js
['react-native-unistyles/plugin', {
  root: 'src',
  autoProcessPaths: ['packages/shared-styles/src']
}]
```

---

## 5. useUnistyles() Causing Unnecessary Re-renders

**Symptom:** Components using `useUnistyles()` re-render on theme/runtime changes (e.g. on every keyboard animation frame when reading `rt.insets.ime`).

**Cause:** `useUnistyles()` returns proxified theme and runtime objects. Reading a property subscribes to it (destructuring alone doesn't), and the whole component re-renders whenever a read value changes.

**Fix:** Minimize usage of `useUnistyles()`. Prefer:

1. **For styling:** Use `StyleSheet.create(theme => ...)` - zero re-renders
2. **For non-style props:** Use `withUnistyles(Component, (theme, rt) => ({...}))`
3. **Only use `useUnistyles()`** when you need theme values in JS logic (not just rendering)

---

## 6. Third-Party Components Not Getting Styles

**Symptom:** Third-party library components (e.g., from `react-native-paper`, `@shopify/flash-list`) don't respond to Unistyles.

**Cause:** The Babel plugin ignores `node_modules` (except the built-in `react-native-reanimated` component paths), so components inside third-party libraries aren't converted to Unistyles factories. They get correct styles on first render but won't update without a re-render.

**Fix (in order of preference):**

1. **If component accepts `style` prop and uses RN components internally:** Whitelist the library's path so its `react-native` imports get replaced:

```js
autoProcessPaths: ['the-library/src']  // substring of the file path; added to the built-in reanimated paths
```

2. **If component needs theme-derived non-style props (or step 1 fails):** Wrap with `withUnistyles` (it also auto-maps `style` / `contentContainerStyle`):

```tsx
const UniFlashList = withUnistyles(FlashList, (theme, rt) => ({
  key: rt.isLandscape ? 'landscape' : 'portrait', // optional: `key` remounts the component instead of passing a prop
  numColumns: rt.isLandscape ? 4 : 2
}))
```

3. **If the library doesn't import `react-native` directly** (own factory, `react-native/Libraries/...` internals): Use `autoRemapImports` in Babel config to map those imports to Unistyles components (`NativeView`, `NativeText`, etc.).

4. **Fallback:** Use `useUnistyles()` hook.

---

## 7. Jest / Testing Failures with NitroModules

**Symptom:** Tests fail with errors about `NitroModules` not being available or `Cannot find module 'react-native-nitro-modules'`.

**Fix:** Add the mocks to Jest `setupFiles`, followed by your config file:

```json
// package.json
{
  "jest": {
    "setupFiles": [
      "react-native-unistyles/mocks",
      "./path/to/your/unistyles.ts"
    ]
  }
}
```

The mocks file handles:
- `react-native-nitro-modules` mock
- `react-native-unistyles` mock (StyleSheet, UnistylesRuntime, withUnistyles, useUnistyles, mq, enums, etc.)
- `react-native-unistyles/reanimated` mock

The mocks must run BEFORE your `StyleSheet.configure` file and any component imports. They don't mock `createUnistylesElement`, `UnistyleDependency` or the SSR helpers, always use the first registered theme, strip variants and render nothing for `Display` / `Hide` / `ScopedTheme` — don't assert on resolved styles or visibility.

---

## 8. React Compiler Ordering

**Symptom:** Styles break or variants don't work when using React Compiler (React Forget).

**Cause:** The Unistyles Babel plugin must process `useVariants` calls BEFORE React Compiler reorganizes the code.

**Fix:** Place Unistyles plugin BEFORE React Compiler in babel config:

```js
// babel.config.js
module.exports = {
  plugins: [
    // Unistyles FIRST
    ['react-native-unistyles/plugin', { root: 'src' }],
    // React Compiler SECOND
    ['babel-plugin-react-compiler', { /* ... */ }]
  ]
}
```

---

## 9. Monorepo Issues

**Symptom:** Babel plugin doesn't process files in shared packages/workspace modules.

**Fix:** The `root` option resolves relative to Babel's `root` (your app directory by default). Files outside it need `autoProcessImports` (exact import source match) or `autoProcessPaths` (matched as a substring of the absolute file path, so don't use `../` relative paths). In monorepos, you may need:

```js
// apps/mobile/babel.config.js
module.exports = {
  plugins: [
    ['react-native-unistyles/plugin', {
      root: 'src',
      autoProcessPaths: [
        'packages/shared-ui/src'
      ],
      autoProcessImports: [
        '@myorg/shared-ui'
      ]
    }]
  ]
}
```

---

## 10. Variant Memory / Performance in Long Lists

**Symptom:** Performance degradation when using `styles.useVariants()` inside FlatList/FlashList item renderers with many items.

**Mitigation:**
1. Keep variant-using styles minimal in list items
2. Consider extracting variant-heavy components outside the list
3. Use dynamic functions instead of variants for per-item styling:

```tsx
// Prefer dynamic functions in list items:
const styles = StyleSheet.create(theme => ({
  item: (isSelected: boolean) => ({
    backgroundColor: isSelected ? theme.colors.selected : theme.colors.background
  })
}))

// Instead of variants:
// styles.useVariants({ selected: isSelected }) // in each list item
```

---

## 11. String Ref Error

**Symptom:** Error: `Detected string based ref which is not supported by Unistyles.`

**Cause:** Using legacy string refs (`ref="myRef"`) which the Unistyles Babel plugin cannot process.

**Fix:** Convert all string refs to `useRef` or `createRef`:

```diff
- <View ref="container" />
+ const containerRef = useRef(null)
+ <View ref={containerRef} />
```

---

## 12. React 19 Requirement

**Symptom:** Error: `Unistyles 🦄: To enable full Fabric power you need to use React 19.0.0 or higher`

**Cause:** v3 requires React 19+ and the New Architecture.

**Fix:** Upgrade to React Native 0.81+ (minimum supported by Unistyles), which includes React 19. The New Architecture is the only architecture since RN 0.82; on RN 0.81 make sure it isn't disabled:

```js
// For bare RN: android/gradle.properties
newArchEnabled=true

// For Expo: app.json
{
  "expo": {
    "newArchEnabled": true
  }
}
```

---

## 13. SSR / Server-Side Rendering Issues

**Symptom:** Hydration mismatches or missing styles on first render in Next.js/SSR.

**Fix:** Use Unistyles SSR utilities from `react-native-unistyles/server`.

**App Router** - a client component that injects styles once per request (it also hydrates on the client, no `hydrateServerUnistyles` needed):

```tsx
'use client'

import { PropsWithChildren, useRef } from 'react'
import { useServerUnistyles } from 'react-native-unistyles/server'
import { useServerInsertedHTML } from 'next/navigation'
import './unistyles'

export const Style = ({ children }: PropsWithChildren) => {
  const isServerInserted = useRef(false)
  const unistyles = useServerUnistyles()

  useServerInsertedHTML(() => {
    if (isServerInserted.current) {
      return null
    }

    isServerInserted.current = true

    return unistyles
  })

  return <>{children}</>
}
// wrap <body> children in layout.tsx with <Style>
```

**Pages Router:**

```tsx
// _document.tsx
import { getServerUnistyles, resetServerUnistyles } from 'react-native-unistyles/server'

static async getInitialProps({ renderPage }: DocumentContext) {
  const page = await renderPage()
  const styles = getServerUnistyles() // React elements (<style> + hydration <script>), not a CSS string

  resetServerUnistyles() // after EVERY request, so CSS/listeners don't leak between requests

  return { ...page, styles }
}

// _app.tsx
useEffect(() => {
  hydrateServerUnistyles() // from 'react-native-unistyles/server'
}, [])
```

Both `useServerUnistyles` and `getServerUnistyles` accept `{ includeRNWStyles?: boolean }` (default `true`).

---

## 14. Edge-to-Edge Layout on Android

**Symptom:** Content renders behind status bar or navigation bar on Android.

**Cause:** v3 enforces edge-to-edge layout on Android for accurate inset reporting (via `WindowInsetsCompat`). `react-native-edge-to-edge` is optional since 3.1.0 — Unistyles enables edge-to-edge itself.

**Fix:** Set `edgeToEdgeEnabled=true` in `android/gradle.properties` (strongly recommended; Expo SDK 54+ does it automatically), then use `rt.insets` in your styles:

```tsx
const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    paddingTop: rt.insets.top,
    paddingBottom: rt.insets.bottom
  }
}))
```

This replaces `react-native-safe-area-context` for most use cases.

---

## 15. `StyleSheet.configure` Throws After Migrating the v2 Config

**Symptoms / errors:**
```
StyleSheet.configure's settings received unexpected key: 'plugins'
Unistyles: You're trying to set initial theme and enable adaptiveThemes, but these options are mutually exclusive.
Unistyles: You're trying to enable adaptiveThemes, but you didn't register both 'light' and 'dark' themes.
StyleSheet.configure's first breakpoint must start from 0.
```

**Cause:** v3 validates the config strictly. `settings` accepts only `adaptiveThemes`, `initialTheme`, `CSSVars` and `nativeBreakpointsMode`.

**Fix:** Remove the v2-only keys (`plugins`, `experimentalCSSMediaQueries`, `windowResizeDebounceTimeMs`, `disableAnimatedInsets`), keep either `initialTheme` or `adaptiveThemes: true` (not both), register `light` + `dark` themes when using adaptive themes, and make the smallest breakpoint `0`.
