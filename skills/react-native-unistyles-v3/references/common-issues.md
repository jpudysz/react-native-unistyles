# Common Issues

Curated from 150+ GitHub issues. Organized by category with symptoms, causes, and solutions.

---

## 1. Setup & Initialization

### "Unistyles was loaded, but it's not configured" after hot reload

**Symptoms:** Error appears after fast refresh / hot reload, not on cold start.
**Cause:** `StyleSheet.configure()` runs in a module scope that doesn't re-execute on HMR.
**Solution:** Ensure `StyleSheet.configure()` is imported in your entry point file. For Expo Router, follow the [Expo Router integration steps](setup-guide.md#expo-router-integration).
**Ref:** [#1098](https://github.com/jpudysz/react-native-unistyles/issues/1098)

### "Unistyles was loaded, but it's not configured. Did you forget to call StyleSheet.configure?"

**Symptoms:** Crash on app start.
**Cause:** `StyleSheet.create()` is called before `StyleSheet.configure()`.
**Solution:** Move `StyleSheet.configure()` to your app's entry point, before any component imports that use `StyleSheet.create`. With no themes/breakpoints, call `StyleSheet.configure({})`.
**Ref:** [#1010](https://github.com/jpudysz/react-native-unistyles/issues/1010)

### StyleSheet.configure timing with Expo Router

**Symptoms:** Styles don't work or "not configured" error with Expo Router.
**Cause:** Expo Router resolves routes before your config runs.
**Solution:**
1. Set `"main": "index.ts"` in package.json
2. Create `index.ts` (or `index.js`) with:
   ```ts
   import 'expo-router/entry'
   import './unistyles'        // your StyleSheet.configure() file
   ```
3. For static rendering, also import config in `app/+html.tsx`

### "Property value expected type of number but got null" for hasAdaptiveThemes

**Symptoms:** Runtime error mentioning `hasAdaptiveThemes` property.
**Cause:** `adaptiveThemes` set to `true` without both `light` and `dark` themes registered (current versions throw "You're trying to enable adaptiveThemes, but you didn't register both 'light' and 'dark' themes").
**Solution:** Ensure themes object has keys named exactly `light` and `dark`:
```tsx
StyleSheet.configure({
  themes: { light: lightTheme, dark: darkTheme },
  settings: { adaptiveThemes: true }
})
```
**Ref:** [#1040](https://github.com/jpudysz/react-native-unistyles/issues/1040)

### setTheme throws / initialTheme + adaptiveThemes error

**Cause:** `initialTheme` and `adaptiveThemes: true` are mutually exclusive, and `UnistylesRuntime.setTheme()` throws while adaptive themes are enabled.
**Solution:** Use one of the two settings. To switch manually at runtime, call `UnistylesRuntime.setAdaptiveThemes(false)` before `setTheme()`.

### Adaptive themes don't follow the OS

**Solution:** Check that Expo `app.json` has `userInterfaceStyle: "automatic"` (bare: `Info.plist` doesn't hardcode `UIUserInterfaceStyle`), and that you haven't forced a scheme with `Appearance.setColorScheme('light' | 'dark')` (use `'unspecified'` to reset; iOS follows this override since 3.6.0, Android before). Requires iOS 15+ / Android 10+.

### "react-native-unistyles/metro is enabled in metro.config.js, remove react-native-unistyles/plugin from babel.config.js"

**Cause:** The Metro integration (3.6.0+) and the Babel plugin are both set up.
**Solution:** Use one of them — remove `react-native-unistyles/plugin` from `babel.config.js` when using `withUnistylesConfig`. Related Metro errors: "withUnistylesConfig was applied twice" (wrap the config once) and "Metro config has no babelTransformerPath" (pass the config returned by `getDefaultConfig`). See [setup-guide.md](setup-guide.md#metro-integration-experimental).

---

## 2. Style Spreading (Most Common Issue)

### "Style is not bound!" error / "we detected style object with 2 unistyles styles" warning

**Symptoms:** Runtime error "Unistyles: Style is not bound!", a `__DEV__` warning about merged Unistyles styles, or styles that stop updating.
**Cause:** Spreading/merging Unistyles styles with `{...styles.x}` (or altering the hidden `unistyles_*` key). Each style carries C++ state — merging two into one object keeps only the first binding.
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
**Cause:** Outside `root`, the Babel plugin recognizes `StyleSheet.create` only when `StyleSheet` is imported from `react-native-unistyles` (or the file matches `autoProcessImports`). Re-exporting through a barrel file (e.g., `export { StyleSheet } from 'react-native-unistyles'` in `utils/index.ts`) breaks detection there. (Inside `root` a heuristic still catches stylesheet-shaped `.create()` calls, but don't rely on it.)
**Solution:** Always import directly:
```tsx
// WRONG
import { StyleSheet } from '@/utils'  // barrel re-export

// CORRECT
import { StyleSheet } from 'react-native-unistyles'
```

### Plugin interferes with other .create() calls

**Symptoms:** Other libraries' `.create()` calls break (e.g., Zustand, custom factories).
**Cause:** In processed files (under `root`, matching `autoProcessImports`, or importing `react-native-unistyles`), the plugin treats any `something.create(arg)` that *looks like* a stylesheet as one: a single object argument whose values are objects, or an arrow function with ≤ 2 params returning a non-empty object.
**Solution:** Change the call shape (e.g. pass an extra argument or a non-arrow factory), or move such factories to a file the plugin doesn't process. Use `debug: true` to see what the plugin detected.
**Ref:** [#993](https://github.com/jpudysz/react-native-unistyles/issues/993)

### Wrong root directory

**Symptoms:** Styles not reactive; Babel plugin appears to do nothing.
**Cause:** The `root` option is missing (the plugin throws), resolves to the project root (throws — it would include `node_modules`), or points to the wrong directory. It's resolved relative to Babel's `root` (project directory by default).
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

**Symptoms:** Shared package / library views not reactive.
**Cause:** Files outside `root` are only processed if they import `react-native-unistyles` (and contain a stylesheet), match `autoProcessImports`, or match `autoProcessPaths`. `node_modules` is ignored unless listed in `autoProcessPaths`.
**Solution:**
```js
['react-native-unistyles/plugin', {
  root: 'src',
  autoProcessImports: ['@my-org/styles'],        // your monorepo files importing this are processed
  autoProcessPaths: ['external-library/components']  // substring of the absolute path, NOT '../relative'
}]
```

---

## 4. Theme Updates Not Propagating

### Frozen / hidden screens show stale styles

**Symptoms:** After changing the theme (or rotating) while a screen is frozen (`freezeOnBlur`, react-navigation `inactiveBehavior` / `<Activity />`, `Suspense` fallback), the screen returns with old styles, or dynamic styles look wrong.
**Cause:** Bugs in re-linking frozen views, fixed in **3.4.0**; also non-serializable dynamic function arguments (functions are dropped, `Date`/class instances become `{}` when the function is re-run natively).
**Solution:** Upgrade to 3.4.0+, and pass only serializable values to dynamic functions. `useUnistyles`/`withUnistyles` components update only after the screen unfreezes (React blocks frozen trees).

### Component not updating at all

Check, in order: the file is processed by the Babel plugin (`debug: true`); the view is a React Native view (otherwise use `withUnistyles`); styles aren't spread; `contentContainerStyle` is passed through `withUnistyles`.

### Nested Text / Animated.Text don't fully switch themes with Reanimated

**Symptoms:** With Reanimated in the tree, nested `<Text>` keeps the old theme color, or variant styles on `Animated.Text` are stale after a breakpoint change.
**Cause:** Reanimated's UI-thread updates interfered with Unistyles' ShadowTree updates.
**Solution:** Fixed in **3.6.0** — upgrade.
**Ref:** [#1045](https://github.com/jpudysz/react-native-unistyles/issues/1045), [#1170](https://github.com/jpudysz/react-native-unistyles/issues/1170), [#1142](https://github.com/jpudysz/react-native-unistyles/issues/1142)

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

**Symptoms:** After theme switch, CSS transition (`transitionProperty`) colors show the old theme's value.
**Cause:** Reanimated CSS transitions kept the previously rendered colors.
**Solution:** Fixed in **3.6.0** — upgrade. On older versions, remount with `key={rt.themeName}` (from `useUnistyles()`).
**Ref:** [#1007](https://github.com/jpudysz/react-native-unistyles/issues/1007)

### iOS gradients (`backgroundImage`) cleared on theme change

**Symptoms:** A `experimental_backgroundImage` / `backgroundImage` string gradient from a StyleSheet disappears on iOS after a theme change.
**Solution:** Fixed in **3.6.0** for React Native 0.83+ (gradients follow theme changes). On older React Native versions they keep the colors React rendered last.
**Ref:** [#1030](https://github.com/jpudysz/react-native-unistyles/issues/1030)

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

### "detected an unsupported FlatList with the horizontal prop" error

**Symptoms:** Render error when `horizontal` on a `FlatList` flips (e.g. `horizontal={rt.isLandscape}` on rotation); flipping back leaks a registry entry.
**Cause:** On Android the native scroll view remounts when `horizontal` changes, and a Unistyles guard threw during that remount (not a React Native bug).
**Solution:** Fixed in **3.6.0** — upgrade. On older versions, remount the list with a `key` tied to `horizontal`, or use FlashList / Legend List.
**Ref:** [#803](https://github.com/jpudysz/react-native-unistyles/issues/803)

### Keyboard inset lag with react-native-keyboard-controller

**Symptoms:** `rt.insets.ime` lags behind actual keyboard position.
**Cause:** Conflict between Unistyles' IME tracking and react-native-keyboard-controller. (Note: on Android, `ime` is the keyboard height minus the bottom inset and is only animated on Android 11+; Unistyles also guards `rt.insets.bottom` from being polluted by keyboard libraries.)
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
**Cause:** Server-rendered styles don't match client-side state, or (without adaptive themes) Unistyles adds the theme class to `<html>`.
**Solution:** Use the SSR utilities from `react-native-unistyles/server` (see [styling-patterns.md](styling-patterns.md#ssr-with-nextjs)):
- App Router: `useServerUnistyles()` inside a `'use client'` component with `useServerInsertedHTML` (hydrates automatically on the client)
- Pages Router: `getServerUnistyles()` + `resetServerUnistyles()` in `_document` `getInitialProps`, `hydrateServerUnistyles()` in a `useEffect` in `_app`
- Add `suppressHydrationWarning` (or the theme class) to `<html>`
- Styles leaking between requests (Pages Router) → you forgot `resetServerUnistyles()`

### Safari 16.3 and below not supported

**Symptoms:** Styles broken or app crashes on older Safari.
**Cause:** Unistyles v3 web implementation uses features not available in Safari < 16.4.
**Solution:** Require Safari 16.4+ or provide a fallback.
**Ref:** [#1073](https://github.com/jpudysz/react-native-unistyles/issues/1073)

### Reanimated animated styles dropped on web

**Symptoms:** On web, a component wrapped with `createUnistylesElement` (e.g. a wrapped `Animated.View`) never animates — `useAnimatedStyle` is silently dropped.
**Solution:** Fixed in **3.6.0** — upgrade. On older versions, use `getWebProps` from `react-native-unistyles/web` (spread `{ className, ref }`) for the Unistyles part.
**Ref:** [#1199](https://github.com/jpudysz/react-native-unistyles/issues/1199), [#1014](https://github.com/jpudysz/react-native-unistyles/issues/1014)

### Breakpoint styles missing at fractional viewport widths

**Symptoms:** On web, under browser zoom (e.g. a 767.5px wide viewport), no breakpoint style applies.
**Solution:** Fixed in **3.6.0**: a breakpoint's media query now ends at `next − 0.02px` (e.g. `max-width: 1199.98px`) instead of `next − 1px`.
**Ref:** [#1241](https://github.com/jpudysz/react-native-unistyles/issues/1241)

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

**Symptoms:** Build error with React Compiler `panicThreshold: 'all_errors'` in components calling `styles.useVariants()`; with the default threshold the compiler silently skips them.
**Solution:** Fixed in **3.6.0** — upgrade (keep the Unistyles plugin before React Compiler). On older versions, avoid `'all_errors'`.
**Ref:** [#1002](https://github.com/jpudysz/react-native-unistyles/issues/1002)

### Plugin ordering

**Symptoms:** Styles not reactive, build errors.
**Cause:** React Compiler runs before Unistyles plugin. With the Metro integration in a bare RN app, a React Compiler entry in `babel.config.js` `plugins` always runs first — keep the Babel plugin there (Expo's preset-based setup is fine).
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

**Symptoms:** Excessive re-renders, especially on theme/orientation/keyboard changes.
**Cause:** `useUnistyles()` re-renders the whole component when any value you **read** changes (subscriptions are created on property access, not destructuring). Reading `rt.insets.ime` re-renders on every keyboard animation frame.
**Solution:** Prefer `StyleSheet.create(theme => ...)` which uses zero-re-render C++ updates. Reserve `useUnistyles()` for cases where you need theme/runtime in JS logic, and read only what you need.

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

### Memory grows with useVariants + dynamic functions

**Symptoms:** Heap grows on every render of a screen calling `styles.useVariants()` when the StyleSheet has a dynamic function (~270 B per call).
**Solution:** Fixed in **3.6.0** — upgrade.
**Ref:** [#1323](https://github.com/jpudysz/react-native-unistyles/pull/1323)

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
