# Third-Party Integration

How to integrate Unistyles v3 with third-party libraries, custom components, and build tools.

## withUnistyles HOC

For third-party components that need theme-derived **non-style props** (e.g., `color`, `size`, `tintColor`).

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

### Static mappings vs uniProps

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

`withUnistyles` automatically processes `style` and `contentContainerStyle` props. You can pass Unistyles styles directly:

```tsx
const UniScrollView = withUnistyles(ScrollView)

<UniScrollView
  style={styles.scroll}
  contentContainerStyle={styles.content}
/>
```

---

## Babel Plugin: autoProcessPaths

By default, the Babel plugin only processes files inside the `root` directory. For files outside `root` (e.g., shared packages in a monorepo), add their paths:

```js
// babel.config.js
module.exports = {
  plugins: [
    ['react-native-unistyles/plugin', {
      root: 'src',
      autoProcessPaths: [
        '../packages/shared-ui/src',
        '../packages/design-system/src',
      ],
    }]
  ]
}
```

**Important:** Paths are relative to the project root (where babel.config.js lives).

---

## Babel Plugin: autoProcessImports

Process files that import from custom package names (useful for internal packages that re-export components):

```js
// babel.config.js
module.exports = {
  plugins: [
    ['react-native-unistyles/plugin', {
      root: 'src',
      autoProcessImports: ['@myorg/ui', '@myorg/shared-components'],
    }]
  ]
}
```

This tells the plugin: "If a file imports from `@myorg/ui`, process the components in that file the same way as standard React Native components."

---

## Babel Plugin: autoRemapImports

Map exotic component imports to Unistyles component factories. Useful when a library exports components with non-standard names that the plugin can't detect:

```js
// babel.config.js
module.exports = {
  plugins: [
    ['react-native-unistyles/plugin', {
      root: 'src',
      autoRemapImports: {
        '@expo/vector-icons': {
          'MaterialIcons': 'Text',     // treat as Text factory
          'FontAwesome': 'Text',
        },
        'react-native-svg': {
          'Svg': 'View',              // treat as View factory
          'Circle': 'View',
        },
      },
    }]
  ]
}
```

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

## react-native-edge-to-edge

Required for Android to get proper inset values. Install and use `rt.insets` in styles:

```bash
npm install react-native-edge-to-edge
```

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
import { UnistylesRuntime, StyleSheet } from 'react-native-unistyles'

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
