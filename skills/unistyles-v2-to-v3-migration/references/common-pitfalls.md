# Common Pitfalls & Troubleshooting

Known issues and solutions gathered from GitHub issues and migration experiences.

---

## 1. Babel Plugin Not Configured / Wrong Root

**Symptom:** Styles don't react to theme/breakpoint changes. Everything renders but nothing updates.

**Error (when `root` is missing):**
```
Unistyles: Babel plugin requires `root` option to be set.
```

**Error (when `root` resolves to project root):**
```
Unistyles: Root option can't resolve to project root as it will include node_modules folder.
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

## 2. Re-exporting StyleSheet from Barrel Files

**Symptom:** Styles don't update reactively. The Babel plugin can't detect your `StyleSheet.create` calls.

**Cause:** The Babel plugin specifically looks for imports from `react-native-unistyles`. If you re-export:

```tsx
// ❌ BAD: utils/index.ts
export { StyleSheet } from 'react-native-unistyles'

// ❌ BAD: some-file.ts
import { StyleSheet } from '../utils'  // Plugin won't detect this!
```

**Fix:** Always import directly from `react-native-unistyles`:

```tsx
// ✅ GOOD
import { StyleSheet } from 'react-native-unistyles'
```

If you need to process files that import from custom paths, use `autoProcessImports`:

```js
['react-native-unistyles/plugin', {
  root: 'src',
  autoProcessImports: ['@myorg/design-system']
}]
```

---

## 3. "Style is not bound!" Error (Style Spreading)

**Symptom:** Runtime error: `Style is not bound!` or styles appear as empty objects.

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

**Cause:** The Babel plugin only processes files under the configured `root` directory. Files outside that path (like a shared library or a different source folder) won't be transformed.

**Fix:**
1. Ensure all files with `StyleSheet.create` are under the `root` directory
2. For files in other directories, add them via `autoProcessPaths`:

```js
['react-native-unistyles/plugin', {
  root: 'src',
  autoProcessPaths: ['packages/shared-styles/src']
}]
```

---

## 5. useUnistyles() Causing Unnecessary Re-renders

**Symptom:** Components using `useUnistyles()` re-render on every theme/runtime change.

**Cause:** `useUnistyles()` returns proxified theme and runtime objects that trigger re-renders when accessed values change.

**Fix:** Minimize usage of `useUnistyles()`. Prefer:

1. **For styling:** Use `StyleSheet.create(theme => ...)` - zero re-renders
2. **For non-style props:** Use `withUnistyles(Component, (theme, rt) => ({...}))`
3. **Only use `useUnistyles()`** when you need theme values in JS logic (not just rendering)

---

## 6. Third-Party Components Not Getting Styles

**Symptom:** Third-party library components (e.g., from `react-native-paper`, `@shopify/flash-list`) don't respond to Unistyles.

**Cause:** The Babel plugin only transforms React Native core components by default. Third-party components using custom native views aren't automatically processed.

**Fix (in order of preference):**

1. **If component accepts `style` prop and uses RN Views internally:** It should work. Check that the library's source path is processed:

```js
autoProcessPaths: ['node_modules/the-library/src']
```

2. **If component needs theme-derived non-style props:** Wrap with `withUnistyles`:

```tsx
const UniFlashList = withUnistyles(FlashList, (theme) => ({
  estimatedItemSize: theme.spacing.listItem
}))
```

3. **If component uses exotic native views:** Use `autoRemapImports` in Babel config.

4. **Fallback:** Use `useUnistyles()` hook.

---

## 7. Jest / Testing Failures with NitroModules

**Symptom:** Tests fail with errors about `NitroModules` not being available or `Cannot find module 'react-native-nitro-modules'`.

**Fix:** Add mocks in your Jest setup file:

```js
// jest.setup.js
require('react-native-unistyles/mocks')
require('./path/to/your/unistyles.config') // your StyleSheet.configure() call
```

The mocks file handles:
- `react-native-nitro-modules` mock
- `react-native-unistyles` complete mock (StyleSheet, UnistylesRuntime, etc.)
- `react-native-unistyles/reanimated` mock

Make sure this runs BEFORE any component imports.

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

**Fix:** The `root` option resolves relative to your Babel config's `root`. In monorepos, you may need:

```js
// apps/mobile/babel.config.js
module.exports = {
  plugins: [
    ['react-native-unistyles/plugin', {
      root: 'src',
      autoProcessPaths: [
        '../../packages/shared-ui/src'
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

**Symptom:** Error: `Unistyles: To enable full Fabric power you need to use React 19.0.0 or higher`

**Cause:** v3 requires React 19+ and the New Architecture.

**Fix:** Upgrade to React Native 0.78+ which includes React 19. Enable the New Architecture:

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

**Fix:** Use Unistyles SSR utilities:

```tsx
import { getServerUnistyles, hydrateServerUnistyles, resetServerUnistyles } from 'react-native-unistyles'

// In your _document.tsx or layout:
// 1. Get server styles
const styles = getServerUnistyles()

// 2. Inject into HTML head
<style dangerouslySetInnerHTML={{ __html: styles }} />

// 3. Hydrate on client
hydrateServerUnistyles()

// 4. Reset between requests (important for serverless)
resetServerUnistyles()
```

---

## 14. Edge-to-Edge Layout on Android

**Symptom:** Content renders behind status bar or navigation bar on Android.

**Cause:** v3 enforces edge-to-edge layout on Android for accurate inset reporting.

**Fix:** Use `rt.insets` in your styles:

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
