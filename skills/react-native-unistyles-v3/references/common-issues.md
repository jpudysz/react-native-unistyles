# Common Issues

Curated from 150+ GitHub issues. Organized by category with symptoms, causes, and solutions.

---

## 1. Setup & Initialization

### "Unistyles was loaded but not configured" after hot reload

**Symptoms:** Error appears after fast refresh / hot reload, not on cold start.
**Cause:** `StyleSheet.configure()` runs in a module scope that doesn't re-execute on HMR.
**Solution:** Ensure `StyleSheet.configure()` is imported in your entry point file. For Expo Router, follow the [Expo Router integration steps](setup-guide.md#expo-router-integration).
**Ref:** [#1098](https://github.com/jpudysz/react-native-unistyles/issues/1098)

### "Unistyles not initialized correctly"

**Symptoms:** Crash on app start.
**Cause:** `StyleSheet.create()` is called before `StyleSheet.configure()`.
**Solution:** Move `StyleSheet.configure()` to your app's entry point, before any component imports that use `StyleSheet.create`.
**Ref:** [#1010](https://github.com/jpudysz/react-native-unistyles/issues/1010)

### StyleSheet.configure timing with Expo Router

**Symptoms:** Styles don't work or "not configured" error with Expo Router.
**Cause:** Expo Router resolves routes before your config runs.
**Solution:**
1. Set `"main": "index.ts"` in package.json
2. Create `index.ts` with:
   ```ts
   import './unistyles'        // configure first
   import 'expo-router/entry'
   ```
3. For static rendering, also import config in `app/+html.tsx`

### "Property value expected type of number but got null" for hasAdaptiveThemes

**Symptoms:** Runtime error mentioning `hasAdaptiveThemes` property.
**Cause:** `adaptiveThemes` set to `true` without both `light` and `dark` themes registered.
**Solution:** Ensure themes object has keys named exactly `light` and `dark`:
```tsx
StyleSheet.configure({
  themes: { light: lightTheme, dark: darkTheme },
  settings: { adaptiveThemes: true }
})
```
**Ref:** [#1040](https://github.com/jpudysz/react-native-unistyles/issues/1040)

---

## 2. Style Spreading (Most Common Issue)

### "Style is not bound!" error

**Symptoms:** Runtime error "Style is not bound!" or styles not applying.
**Cause:** Spreading Unistyles styles with `{...styles.x}`. v3 styles are C++ proxy objects — spreading breaks the native binding.
**Solution:** ALWAYS use array syntax:
```tsx
// WRONG
<View style={{ ...styles.container, ...styles.extra }} />
<View style={{ ...styles.container, marginTop: 10 }} />

// CORRECT
<View style={[styles.container, styles.extra]} />
<View style={[styles.container, { marginTop: 10 }]} />
```

### Spreading in useAnimatedStyle callbacks

**Symptoms:** Animated styles don't update or crash.
**Cause:** Spreading Unistyles styles inside `useAnimatedStyle`.
**Solution:** Use array syntax when combining:
```tsx
// WRONG
const animStyle = useAnimatedStyle(() => ({ ...styles.box }))

// CORRECT
<Animated.View style={[styles.box, animStyle]} />
```

---

## 3. Babel Plugin Issues

### Re-exporting StyleSheet from barrel files

**Symptoms:** Styles not reactive; theme changes have no effect.
**Cause:** The Babel plugin detects `StyleSheet.create` by checking the import source is `react-native-unistyles`. Re-exporting through a barrel file (e.g., `export { StyleSheet } from 'react-native-unistyles'` in `utils/index.ts`) breaks detection.
**Solution:** Always import directly:
```tsx
// WRONG
import { StyleSheet } from '@/utils'  // barrel re-export

// CORRECT
import { StyleSheet } from 'react-native-unistyles'
```

### Plugin interferes with other .create() calls

**Symptoms:** Other libraries' `.create()` calls break (e.g., Zustand, custom factories).
**Cause:** The Babel plugin processes any `StyleSheet.create()` it finds.
**Solution:** The plugin only processes `StyleSheet.create()` when `StyleSheet` is imported from `react-native-unistyles`. If you have a different `StyleSheet` variable, rename it to avoid collision.
**Ref:** [#993](https://github.com/jpudysz/react-native-unistyles/issues/993)

### Wrong root directory

**Symptoms:** Styles not reactive; Babel plugin appears to do nothing.
**Cause:** The `root` option in Babel config resolves to the project root or an incorrect directory.
**Solution:** `root` must point to your **source code directory**, not the project root:
```js
// WRONG — root resolves to project root
['react-native-unistyles/plugin', { root: '.' }]
['react-native-unistyles/plugin', { root: '' }]

// CORRECT
['react-native-unistyles/plugin', { root: 'src' }]
['react-native-unistyles/plugin', { root: 'app' }]  // for Expo Router
```

### Files outside root not processed

**Symptoms:** Shared package styles not reactive.
**Cause:** Only files inside `root` are processed by default.
**Solution:** Add `autoProcessPaths` for additional directories:
```js
['react-native-unistyles/plugin', {
  root: 'src',
  autoProcessPaths: ['../packages/shared/src']
}]
```

---

## 4. Theme Updates Not Propagating

### Nested Text components + Reanimated conflict

**Symptoms:** Nested `<Text>` components don't update color when theme changes while using Reanimated.
**Cause:** Reanimated's animated components can interfere with Unistyles' ShadowTree updates on nested text.
**Solution:** Ensure nested Text components have explicit style bindings. If using Reanimated, avoid wrapping Text in Animated containers for theme-dependent colors.
**Ref:** [#1045](https://github.com/jpudysz/react-native-unistyles/issues/1045)

### ScopedTheme not applied to dynamic children

**Symptoms:** Items rendered inside `<ScopedTheme>` after mount don't pick up the scoped theme.
**Cause:** ScopedTheme applies at mount time. Dynamically added children (e.g., FlatList items) may not inherit.
**Status:** WONTFIX — by design.
**Workaround:** Wrap each dynamically rendered item in its own `<ScopedTheme>`:
```tsx
<ScopedTheme name="dark">
  {items.map(item => (
    <ScopedTheme key={item.id} name="dark">
      <ItemCard item={item} />
    </ScopedTheme>
  ))}
</ScopedTheme>
```
**Ref:** [#955](https://github.com/jpudysz/react-native-unistyles/issues/955)

### Reanimated CSS transitions stale colors

**Symptoms:** After theme switch, CSS transition colors show the old theme's value.
**Cause:** Reanimated CSS transitions cache the initial color value.
**Solution:** Use `key={rt.themeName}` to force re-mount on theme change:
```tsx
const { rt } = useUnistyles()
<Animated.View key={rt.themeName} style={styles.card} />
```
**Ref:** [#1007](https://github.com/jpudysz/react-native-unistyles/issues/1007)

### withUnistyles not always updating

**Symptoms:** Wrapped component doesn't re-render when theme changes.
**Cause:** The wrapped component may have internal memoization preventing updates.
**Solution:** Pass `key` prop tied to theme:
```tsx
const UniButton = withUnistyles(Button, (theme) => ({
  color: theme.colors.primary,
  key: theme.colors.primary,  // force update
}))
```
**Ref:** [#980](https://github.com/jpudysz/react-native-unistyles/issues/980)

### Theme reverts after app background on Android

**Symptoms:** Theme resets to initial theme when app returns from background.
**Cause:** Android activity recreation can re-trigger initialization.
**Solution:** Use `adaptiveThemes: true` if following OS theme, or persist theme choice and use `initialTheme: () => getStoredTheme()`.
**Ref:** [#963](https://github.com/jpudysz/react-native-unistyles/issues/963)

---

## 5. Android-Specific

### FlatList crash on orientation change

**Symptoms:** App crashes when rotating device while FlatList is visible.
**Cause:** React Native core FlatList issue, not Unistyles-specific.
**Solution:** Use FlashList or Legend List instead of FlatList.
**Ref:** [#803](https://github.com/jpudysz/react-native-unistyles/issues/803)

### Keyboard inset lag with react-native-keyboard-controller

**Symptoms:** `rt.insets.ime` lags behind actual keyboard position.
**Cause:** Conflict between Unistyles' IME tracking and react-native-keyboard-controller.
**Solution:** Use only one keyboard tracking solution. Prefer `rt.insets.ime` and remove `react-native-keyboard-controller`, or vice versa.
**Ref:** [#1065](https://github.com/jpudysz/react-native-unistyles/issues/1065)

### CMake build failures

**Symptoms:** Build fails with CMake errors on Android.
**Cause:** Various CMake configuration issues, often related to NDK version or build tools.
**Solution:** Ensure you're using a compatible NDK version. Clean build:
```bash
cd android && ./gradlew clean && cd ..
npx react-native run-android
```
**Ref:** [#1058](https://github.com/jpudysz/react-native-unistyles/issues/1058), [#889](https://github.com/jpudysz/react-native-unistyles/issues/889), [#1013](https://github.com/jpudysz/react-native-unistyles/issues/1013)

### Screen orientation not updating runtime values

**Symptoms:** `rt.screen.width` / `rt.screen.height` don't update on rotation.
**Cause:** Missing orientation listener setup or Android activity configuration.
**Solution:** Ensure your AndroidManifest.xml allows orientation changes:
```xml
<activity android:configChanges="keyboard|keyboardHidden|orientation|screenSize|screenLayout|uiMode" />
```
**Ref:** [#1033](https://github.com/jpudysz/react-native-unistyles/issues/1033)

---

## 6. Web-Specific

### SSR hydration mismatches

**Symptoms:** React hydration warnings on page load with SSR.
**Cause:** Server-rendered styles don't match client-side computed styles.
**Solution:** Use the SSR utilities:
```tsx
// Server: inject styles
const styles = useServerUnistyles()  // or getServerUnistyles()

// Client: hydrate
hydrateServerUnistyles()
```

### Safari 16.3 and below not supported

**Symptoms:** Styles broken or app crashes on older Safari.
**Cause:** Unistyles v3 web implementation uses features not available in Safari < 16.4.
**Solution:** Require Safari 16.4+ or provide a fallback.
**Ref:** [#1073](https://github.com/jpudysz/react-native-unistyles/issues/1073)

### Styles not working on Reanimated Animated.View on web

**Symptoms:** Animated.View doesn't receive Unistyles styles on web platform.
**Cause:** Reanimated's web implementation may not forward the style processing correctly.
**Solution:** Use `getWebProps` or apply styles differently on web.
**Ref:** [#1014](https://github.com/jpudysz/react-native-unistyles/issues/1014)

### Gap polyfill incorrect margins on SmartTV

**Symptoms:** `gap` property produces wrong spacing on SmartTV web browsers.
**Cause:** Polyfill for `gap` uses margins which behave differently on some TV browsers.
**Solution:** Use explicit margin/padding instead of `gap` for TV targets.
**Ref:** [#1091](https://github.com/jpudysz/react-native-unistyles/issues/1091)

---

## 7. TypeScript Issues

### boxShadow array in variants incorrect return type

**Symptoms:** TypeScript error when using `boxShadow` array inside variant styles.
**Cause:** Type inference doesn't correctly handle arrays inside variant branches.
**Workaround:** Cast with `as any` or extract the shadow to a const:
```tsx
const shadow = [{ offsetX: 0, offsetY: 2, blurRadius: 4, color: 'rgba(0,0,0,0.1)' }]

variants: {
  elevated: {
    true: { boxShadow: shadow as any },
  },
}
```
**Ref:** [#1047](https://github.com/jpudysz/react-native-unistyles/issues/1047)

### withUnistyles inference failures

**Symptoms:** TypeScript can't infer prop types when using `withUnistyles`.
**Cause:** Complex generic inference in the HOC type.
**Workaround:** Explicitly type the component:
```tsx
const UniButton = withUnistyles<typeof Button, { color: string }>(
  Button,
  (theme) => ({ color: theme.colors.primary })
)
```
**Ref:** [#1008](https://github.com/jpudysz/react-native-unistyles/issues/1008)

### Variant categories with different shapes

**Symptoms:** TypeScript errors when variant categories have different style properties.
**Cause:** TypeScript tries to unify all variant branch types.
**Workaround:** Ensure all branches in a variant category have compatible types, or use type assertions.
**Ref:** [#1052](https://github.com/jpudysz/react-native-unistyles/issues/1052)

---

## 8. React Compiler

### useVariants breaks with panicThreshold: 'all_errors'

**Symptoms:** Build error or runtime crash when using `styles.useVariants()` with React Compiler `panicThreshold: 'all_errors'`.
**Cause:** React Compiler can't analyze the `useVariants` call pattern.
**Status:** Known issue, planned fix in v4.
**Workaround:** Use `panicThreshold: 'none'` (default) or `'critical_errors'`.
**Ref:** [#1002](https://github.com/jpudysz/react-native-unistyles/issues/1002)

### Plugin ordering

**Symptoms:** Styles not reactive, build errors.
**Cause:** React Compiler runs before Unistyles plugin.
**Solution:** Unistyles plugin MUST come BEFORE React Compiler in babel.config.js:
```js
plugins: [
  ['react-native-unistyles/plugin', { root: 'src' }],  // FIRST
  'babel-plugin-react-compiler',                         // SECOND
]
```

---

## 9. Performance

### useUnistyles causes re-renders

**Symptoms:** Excessive re-renders, especially on theme/orientation changes.
**Cause:** `useUnistyles()` subscribes to theme and runtime changes, triggering re-renders.
**Solution:** Prefer `StyleSheet.create(theme => ...)` which uses zero-re-render C++ updates. Reserve `useUnistyles()` for cases where you need theme/runtime in JS logic.

### Variant memory in long lists

**Symptoms:** High memory usage or slow performance when using variants in long list items.
**Cause:** Each list item with `useVariants()` maintains its own variant state.
**Solution:** Use dynamic functions instead of variants for list items:
```tsx
// Instead of variants:
const styles = StyleSheet.create(theme => ({
  item: (isActive: boolean) => ({
    backgroundColor: isActive ? theme.colors.active : theme.colors.surface,
  }),
}))

// Usage in list item:
<View style={styles.item(isActive)} />
```
**Ref:** [#1034](https://github.com/jpudysz/react-native-unistyles/issues/1034)

### Tab navigation slow theme change

**Symptoms:** Theme change takes noticeable time with many tab screens.
**Cause:** Many mounted stylesheets updating simultaneously.
**Solution:** Use `adaptiveThemes` for smooth OS-level transitions, or batch theme updates.
**Ref:** [#1107](https://github.com/jpudysz/react-native-unistyles/issues/1107)

---

## 10. Third-Party Library Conflicts

### Pressable from react-native-gesture-handler stale theme

**Symptoms:** `Pressable` from `react-native-gesture-handler` doesn't update on theme change.
**Cause:** RNGH's Pressable doesn't go through the standard React Native style processing that Unistyles hooks into.
**Solution:** Use React Native's built-in `Pressable` or wrap RNGH's Pressable with `withUnistyles`:
```tsx
import { Pressable as GHPressable } from 'react-native-gesture-handler'
import { withUnistyles } from 'react-native-unistyles'

const Pressable = withUnistyles(GHPressable)
```
**Ref:** [#1109](https://github.com/jpudysz/react-native-unistyles/issues/1109)

### withUnistyles wraps elements on RN Web breaking SVG composition

**Symptoms:** SVG elements break when parent is wrapped with `withUnistyles` on web.
**Cause:** `withUnistyles` wraps the component in an additional View on web, breaking SVG's direct parent-child relationship.
**Solution:** Use `useUnistyles()` hook instead for SVG containers, or apply styles directly.
**Ref:** [#1087](https://github.com/jpudysz/react-native-unistyles/issues/1087)
