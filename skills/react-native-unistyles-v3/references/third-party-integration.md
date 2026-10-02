# Third-Party Integration

How to integrate Unistyles v3 with third-party libraries, custom components, and build tools.

## withUnistyles HOC

For components that need theme-derived **non-style props** (e.g., `color`, `size`, `trackColor` — including RN components like `Button`/`Switch`), for `contentContainerStyle`, and for third-party views that don't expose a native ref (so Unistyles can't update them from C++).

On iOS/Android a wrapped component is always subscribed to theme changes; other dependencies (insets, breakpoints, ...) re-render it only if the mappings or the passed styles use them.

### Basic wrapping

```tsx
import { withUnistyles } from 'react-native-unistyles'
import { Button } from 'some-ui-library'

const UniButton = withUnistyles(Button, (theme, rt) => ({
  color: theme.colors.primary,
  size: rt.screen.width > 400 ? 'large' : 'small',
}))

// Usage — mapped props are applied automatically, can be overridden
<UniButton title="Press me" />
<UniButton title="Override" color="red" />  // overrides mapped color
```

### Mappings vs uniProps

The second argument to `withUnistyles` maps theme/runtime values to props. These are applied as **defaults** — the consumer can override them:

```tsx
const UniIcon = withUnistyles(Icon, (theme) => ({
  color: theme.colors.icon,
  size: 24,
}))

// theme.colors.icon is used by default
<UniIcon name="home" />

// Consumer overrides color
<UniIcon name="home" color="red" />
```

Mappings can't see component props/state. For that, pass `uniProps` per instance:

```tsx
const UniSwitch = withUnistyles(Switch)

<UniSwitch
  uniProps={(theme) => ({
    trackColor: { true: isDisabled ? theme.colors.disabled : theme.colors.primary },
  })}
/>
```

Priority: mappings < `uniProps` < inline props.

### Remounting with `key`

Mappings and `uniProps` can return `key` — it's used as the React `key` (not passed down), so changing it remounts the component (`uniProps` wins if both set):

```tsx
const UniFlashList = withUnistyles(FlashList, (theme, rt) => ({
  key: rt.isLandscape ? 'landscape' : 'portrait',
  numColumns: rt.isLandscape ? 4 : 2,
}))
```

### Ref forwarding

Refs are forwarded automatically:

```tsx
const UniInput = withUnistyles(TextInput, (theme) => ({
  placeholderTextColor: theme.colors.placeholder,
  selectionColor: theme.colors.primary,
}))

const inputRef = useRef<TextInput>(null)
<UniInput ref={inputRef} placeholder="Type here" />
```

### style and contentContainerStyle auto-processing

`withUnistyles` automatically processes `style` and `contentContainerStyle` props (they can't be returned from mappings/`uniProps`). You can pass Unistyles styles directly:

```tsx
const UniScrollView = withUnistyles(ScrollView)

<UniScrollView
  style={styles.scroll}
  contentContainerStyle={styles.content}
/>
```

---

## Babel Plugin: autoProcessPaths

The plugin processes every file under `root` and always ignores `node_modules`. `autoProcessPaths` opts 3rd party code in: inside these paths, `react-native` imports are replaced with Unistyles ref-borrowing factories, so the library's views update from C++:

```js
// babel.config.js
module.exports = {
  plugins: [
    ['react-native-unistyles/plugin', {
      root: 'src',
      autoProcessPaths: [
        'external-library/components',
        'my-ui-kit/src',
      ],
    }]
  ]
}
```

**Important:** each entry is matched as a **substring of the absolute file path** — use path fragments like `'some-lib/src'`, not relative paths like `'../packages/ui'` (those never match). `react-native-reanimated/src/component` and `react-native-reanimated/lib/module/component` are always included; your paths are added to them.

---

## Babel Plugin: autoProcessImports

Force-process any file (outside `node_modules`) that imports one of these sources — the way to cover monorepo packages that live outside `root`:

```js
// babel.config.js
module.exports = {
  plugins: [
    ['react-native-unistyles/plugin', {
      root: 'src',
      autoProcessImports: ['@my-org/styles', '@my-org/ui'],
    }]
  ]
}
```

This tells the plugin: "If a file imports exactly `@my-org/styles`, process it like a file under `root`" (stylesheets + react-native component factories).

---

## Babel Plugin: autoRemapImports

Advanced (rarely needed): for a `node_modules` library that doesn't import `react-native` components directly (e.g. imports raw native components from `react-native/Libraries/...`), remap those imports to Unistyles factories (names from `react-native-unistyles/components/native`, e.g. `NativeView`, `NativeText`):

```js
// babel.config.js
module.exports = {
  plugins: [
    ['react-native-unistyles/plugin', {
      root: 'src',
      autoRemapImports: [
        {
          path: 'node_modules/custom-library/components',  // must be a path within node_modules
          imports: [
            {
              isDefault: false,
              name: 'NativeText',
              path: 'react-native/Libraries/Text/TextNativeComponent',
              mapTo: 'NativeText',
            },
            {
              isDefault: true,
              path: 'react-native/Libraries/Components/View/ViewNativeComponent',
              mapTo: 'NativeView',
            },
          ],
        },
      ],
    }]
  ]
}
```

It doesn't make non-RN views (e.g. SVG, icon fonts) reactive — use `withUnistyles` for those.

---

## Re.Pack

Use `RepackUnistylePlugin` from `react-native-unistyles/repack-plugin` in your Rspack config instead of the Babel config entry; pass the same options as `unistylesPluginOptions` (`root` required). See [setup-guide.md](setup-guide.md#repack).

---

## React Compiler

### Plugin ordering

The Unistyles Babel plugin **MUST come BEFORE** React Compiler:

```js
// babel.config.js
module.exports = {
  plugins: [
    ['react-native-unistyles/plugin', { root: 'src' }],    // FIRST
    'babel-plugin-react-compiler',                           // SECOND
  ]
}
```

### useVariants incompatibility

`styles.useVariants()` may break with React Compiler's `panicThreshold: 'all_errors'` setting ([#1002](https://github.com/jpudysz/react-native-unistyles/issues/1002)). This is a known issue planned for fix in v4.

**Workaround:** Use `panicThreshold: 'none'` (default) or `'critical_errors'` instead of `'all_errors'`.

---

## Reanimated

### Version requirements

- `react-native-reanimated` 3.17.3+ **or** 4.0.0-beta.3+

### Theme in worklets

Use `useAnimatedTheme()` from `react-native-unistyles/reanimated` (a `SharedValue`, no re-renders, follows `ScopedTheme`) instead of `UnistylesRuntime.getTheme()` (doesn't update worklets) or `useUnistyles()` (re-renders). Animate variant colors with `useAnimatedVariantColor(styles.x, 'backgroundColor')`, which returns a `SharedValue<string>` to use inside `useAnimatedStyle`.

### CSS transitions workaround

When using Reanimated's CSS transitions, theme-dependent colors may become stale after theme changes. Force re-mount with `key`:

```tsx
const { rt } = useUnistyles()

// key forces re-mount when theme changes, refreshing CSS transitions
<Animated.View
  key={rt.themeName}
  style={[styles.card, { transition: [{ property: 'backgroundColor', duration: 300 }] }]}
/>
```

See [#1007](https://github.com/jpudysz/react-native-unistyles/issues/1007).

### Array syntax for combining styles

When combining Reanimated animated styles with Unistyles styles, always use array syntax:

```tsx
const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ translateY: offset.value }],
}))

// CORRECT
<Animated.View style={[styles.container, animatedStyle]} />

// WRONG — breaks proxy binding
<Animated.View style={{ ...styles.container, ...animatedStyle }} />
```

---

## Edge-to-edge (Android)

Unistyles reads insets with `WindowInsetsCompat`, which needs an edge-to-edge layout — Unistyles enables it automatically. `react-native-edge-to-edge` is **optional** since v3.1.0; instead set `edgeToEdgeEnabled=true` in `android/gradle.properties` (Expo SDK 54+ does this for you). Keep `react-native-edge-to-edge` only if other libraries detect it (e.g. `react-native-bootsplash`, `react-native-permissions`). Then use `rt.insets` in styles:

```tsx
const styles = StyleSheet.create((theme, rt) => ({
  header: {
    paddingTop: rt.insets.top,
  },
  bottomBar: {
    paddingBottom: rt.insets.bottom,
  },
}))
```

This replaces `react-native-safe-area-context` for most use cases. No `<SafeAreaProvider>` or `useSafeAreaInsets()` needed.

---

## Frozen / hidden screens

Screens hidden without unmounting keep their Unistyles bindings: `freezeOnBlur` (react-navigation / react-native-screens, via `react-freeze`), react-navigation `inactiveBehavior` (React `<Activity />`), and `Suspense` fallbacks. Theme/runtime changes made while hidden are applied when the screen becomes visible (Suspense/react-freeze since 3.2.0, `<Activity />` since 3.3.0, stale-style fixes in **3.4.0** — upgrade if frozen screens come back with outdated styles). Components using `useUnistyles`/`withUnistyles` re-render only after unfreezing.

---

## FlatList Alternatives

`FlatList` has a known crash on orientation change ([#803](https://github.com/jpudysz/react-native-unistyles/issues/803)) — this is a React Native core issue, not Unistyles-specific.

**Recommended alternatives:**
- [FlashList](https://github.com/Shopify/flash-list) by Shopify
- [Legend List](https://github.com/LegendApp/legend-list) by LegendApp

Both work correctly with Unistyles orientation changes.

---

## react-native-safe-area-context

Mostly **replaced** by Unistyles' built-in `rt.insets`:

| Before (safe-area-context) | After (Unistyles v3) |
|---------------------------|----------------------|
| `<SafeAreaProvider>` | Not needed |
| `useSafeAreaInsets()` | `rt.insets` in StyleSheet.create |
| `<SafeAreaView>` | Use `rt.insets.top` / `rt.insets.bottom` in styles |

```tsx
// Before
import { useSafeAreaInsets } from 'react-native-safe-area-context'
const Component = () => {
  const insets = useSafeAreaInsets()
  return <View style={{ paddingTop: insets.top }} />
}

// After
const styles = StyleSheet.create((theme, rt) => ({
  container: { paddingTop: rt.insets.top }
}))
const Component = () => <View style={styles.container} />
```

---

## Design System Libraries

For design system libraries (Paper, Tamagui, NativeBase, etc.) that have their own theming:

### Approach 1: Sync themes

Keep the library's theme in sync with Unistyles:

```tsx
import { StyleSheet, UnistyleDependency, UnistylesRuntime } from 'react-native-unistyles'

// Listen for Unistyles theme changes and sync
StyleSheet.addChangeListener((deps) => {
  if (deps.includes(UnistyleDependency.Theme)) {
    const theme = UnistylesRuntime.getTheme()
    // Update external library's theme
    externalLibrary.setTheme(mapToExternalTheme(theme))
  }
})
```

### Approach 2: withUnistyles wrapper

Wrap library components that need theme-derived props:

```tsx
import { withUnistyles } from 'react-native-unistyles'
import { Button as PaperButton } from 'react-native-paper'

const UniPaperButton = withUnistyles(PaperButton, (theme) => ({
  buttonColor: theme.colors.primary,
  textColor: theme.colors.onPrimary,
}))
```

### Approach 3: useUnistyles for complex cases

When you need full control:

```tsx
import { useUnistyles } from 'react-native-unistyles'

const MyScreen = () => {
  const { theme } = useUnistyles()

  return (
    <ExternalProvider theme={mapToExternal(theme)}>
      <Content />
    </ExternalProvider>
  )
}
```
