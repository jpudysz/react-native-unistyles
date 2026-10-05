# API Reference

Complete API for every export from `react-native-unistyles`.

## StyleSheet

The main API. Import from `react-native-unistyles`. It is a **full polyfill** of React Native's `StyleSheet` — replace all `import { StyleSheet } from 'react-native'` imports.

```tsx
import { StyleSheet } from 'react-native-unistyles'
```

### StyleSheet.create(styles)

Creates a reactive stylesheet. Returns an object with the same keys as your stylesheet, plus a `useVariants()` method. Each style value is a C++ proxy object.

**Overload 1 — Static object:**
```tsx
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 }
})
```

**Overload 2 — Theme function (zero re-renders on theme change):**
```tsx
const styles = StyleSheet.create(theme => ({
  container: { backgroundColor: theme.colors.background }
}))
```

**Overload 3 — Theme + miniRuntime function (zero re-renders on theme/device change):**
```tsx
const styles = StyleSheet.create((theme, rt) => ({
  container: {
    backgroundColor: theme.colors.background,
    paddingTop: rt.insets.top,
    width: rt.screen.width > 768 ? 500 : rt.screen.width - 32
  }
}))
```

**Dynamic functions — pass arguments at the call site:**
```tsx
const styles = StyleSheet.create(theme => ({
  box: (width: number, isActive: boolean) => ({
    width,
    backgroundColor: isActive ? theme.colors.active : theme.colors.inactive,
  })
}))

// Usage:
<View style={styles.box(200, true)} />
```

Arguments must be serializable (strings, numbers, booleans, `null`, `undefined`, plain arrays/objects): they're stored in C++ and the function is re-run natively on theme/runtime changes. Functions are dropped (shifting the remaining arguments); `Date`, `Map`, `Set` and class instances become plain objects.

`boxShadow` and `filter: [{ dropShadow }]` also accept CSS-like strings (e.g. `boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'`), parsed on iOS/Android.

### StyleSheet.configure(config)

One-time initialization. Must be called before any `StyleSheet.create()`.

```tsx
StyleSheet.configure({
  themes?: { [name: string]: ThemeObject },
  breakpoints?: { [name: string]: number },  // first must be 0
  settings?: {
    initialTheme?: string | (() => string),     // mutually exclusive with adaptiveThemes: true
    adaptiveThemes?: boolean,
    CSSVars?: boolean,                          // web only, default true
    nativeBreakpointsMode?: 'pixels' | 'points', // default 'pixels'
  }
})
```

Unknown keys throw. `nativeBreakpointsMode: 'pixels'` compares breakpoints/`mq` against `UnistylesRuntime.screen` (points on iOS, dp on Android); `'points'` divides that by `pixelRatio` first.

### StyleSheet utilities

| Property/Method | Description |
|----------------|-------------|
| `StyleSheet.hairlineWidth` | Thinnest line the device can draw (computed from `pixelRatio` on native; always `1` on web) |
| `StyleSheet.absoluteFill` | Static `{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }` |
| `StyleSheet.absoluteFillObject` | Same static object as `absoluteFill` |
| `StyleSheet.compose(a, b)` | Compose two styles |
| `StyleSheet.flatten(style)` | Flatten a style array into a single object |

### StyleSheet.addChangeListener(listener)

Subscribe to Unistyles dependency changes:

```tsx
import { StyleSheet, UnistyleDependency } from 'react-native-unistyles'

const unsubscribe = StyleSheet.addChangeListener((dependencies: UnistyleDependency[]) => {
  if (dependencies.includes(UnistyleDependency.Theme)) {
    // theme changed (or was updated with updateTheme)
  }
})

// Later:
unsubscribe()
```

---

## UnistylesRuntime

Singleton providing read-only access to device/app state and methods to change themes.

```tsx
import { UnistylesRuntime } from 'react-native-unistyles'
```

### Read-only properties

| Property | Type | Description |
|----------|------|-------------|
| `colorScheme` | `ColorScheme` (`'light' \| 'dark' \| 'unspecified'`) | OS color scheme |
| `themeName` | `string \| undefined` | Current theme name (inside a `ScopedTheme` during render: the scoped name) |
| `breakpoint` | `string \| undefined` | Current active breakpoint name |
| `hasAdaptiveThemes` | `boolean` | Whether adaptive themes are enabled |
| `screen` | `{ width: number, height: number }` | Screen dimensions (points on iOS, dp on Android; `window.innerWidth/innerHeight` on web) |
| `insets` | `{ top, bottom, left, right, ime: number }` | Safe area insets + keyboard (ime); all `0` on web |
| `orientation` | `Orientation` (`'portrait' \| 'landscape'`) | Current orientation |
| `isPortrait` | `boolean` | Shorthand for portrait check |
| `isLandscape` | `boolean` | Shorthand for landscape check |
| `pixelRatio` | `number` | Device pixel ratio |
| `fontScale` | `number` | User font scale preference |
| `rtl` | `boolean` | Whether layout direction is RTL. Updates at runtime on Android (`I18nManager.forceRTL` / locale change) and web (`dir` on `<html>`); on iOS read at startup (restart required) |
| `contentSizeCategory` | `IOSContentSizeCategory \| AndroidContentSizeCategory \| WebContentSizeCategory` | Accessibility text size (`'web-unspecified'` on web) |
| `breakpoints` | `UnistylesBreakpoints` | Registered breakpoints object |

### Sub-objects

| Property | Type | Description |
|----------|------|-------------|
| `statusBar` | `UnistylesStatusBar` | Status bar dimensions and controls |
| `navigationBar` | `UnistylesNavigationBar` | Navigation bar dimensions and controls (Android only; `0` on iOS/web) |

### Methods

```tsx
// Switch theme (throws while adaptive themes are enabled)
UnistylesRuntime.setTheme('dark')

// Get theme object by name (current theme if omitted)
const darkTheme = UnistylesRuntime.getTheme('dark')

// Update theme values at runtime (re-styles affected views if it's the current theme)
UnistylesRuntime.updateTheme('light', currentTheme => ({
  ...currentTheme,
  colors: { ...currentTheme.colors, primary: '#ff0000' }
}))

// Enable/disable adaptive themes
UnistylesRuntime.setAdaptiveThemes(true)

// Set root view background color (any RN color; omit to reset to transparent; sets <html> background on web)
UnistylesRuntime.setRootViewBackgroundColor('#ffffff')

// Immersive mode: Android hides status + navigation bars; iOS hides only the status bar (fade); no-op on web
UnistylesRuntime.setImmersiveMode(true)
```

---

## StatusBar

Accessed via `UnistylesRuntime.statusBar`.

```tsx
UnistylesRuntime.statusBar
```

| Property/Method | Type | Description |
|----------------|------|-------------|
| `width` | `number` | Status bar width |
| `height` | `number` | Status bar height |
| `setHidden(hidden, animation?)` | `(boolean, 'none' \| 'fade' \| 'slide') => void` | Show/hide status bar (`animation` used on iOS) |
| `setStyle(style, animated?)` | `(StatusBarStyle, boolean?) => void` | Set content style: `StatusBarStyle.Default` / `.Light` / `.Dark` |

```tsx
import { UnistylesRuntime, StatusBarStyle } from 'react-native-unistyles'

UnistylesRuntime.statusBar.setStyle(StatusBarStyle.Light, true)
UnistylesRuntime.statusBar.setHidden(true, 'slide')
```

On web, status/navigation bar dimensions are `0` and these setters do nothing.

---

## NavigationBar

Accessed via `UnistylesRuntime.navigationBar`.

```tsx
UnistylesRuntime.navigationBar
```

| Property/Method | Type | Description |
|----------------|------|-------------|
| `width` | `number` | Navigation bar width (Android only, `0` on iOS) |
| `height` | `number` | Navigation bar height (Android only, `0` on iOS) |
| `setHidden(hidden)` | `(boolean) => void` | Show/hide navigation bar (Android only) |

---

## mq (Media Queries)

Build media query symbols for breakpoint-based and pixel-based responsive styles.

```tsx
import { mq } from 'react-native-unistyles'
```

### API

```tsx
// Width only
mq.only.width(min?, max?)          // returns symbol

// Height only
mq.only.height(min?, max?)         // returns symbol

// Width AND height
mq.width(min?, max?).and.height(min?, max?)   // returns symbol

// Height AND width
mq.height(min?, max?).and.width(min?, max?)   // returns symbol
```

Parameters can be:
- **Breakpoint names**: `'sm'`, `'md'`, `'lg'` (resolved to their values when `mq` is called — `StyleSheet.configure` must run first; unknown names resolve to `0`)
- **Numbers**: `320`, `768`, `1200` (same units as `UnistylesRuntime.screen`)
- **`null`/`undefined` min** → `0`; omitted max → unbounded

**Both bounds are inclusive.** Adjacent ranges like `(240, 380)` and `(380)` both match width `380`; on native the first matching query in the style object wins. Invalid ranges (`('xl', 'sm')`, `(500, 200)`) are ignored.

### Examples

```tsx
mq.only.width('sm', 'md')           // sm <= width <= md
mq.only.width(320, 768)             // 320 <= width <= 768
mq.only.width('sm')                 // width >= sm (no max)
mq.only.width(null, 600)            // 0 <= width <= 600
mq.width('sm', 'lg').and.height(400, 800)  // combined width + height
```

Used in:
- Style values (breakpoint-like keys): `{ [mq.only.width(320, 768)]: 16 }`
- `<Display mq={...}>` and `<Hide mq={...}>` components

---

## withUnistyles

HOC for wrapping components with theme/runtime-derived props.

```tsx
import { withUnistyles } from 'react-native-unistyles'
```

### Basic usage — static prop mappings

```tsx
const UniButton = withUnistyles(Button, (theme, rt) => ({
  color: theme.colors.primary,
  size: rt.screen.width > 400 ? 'large' : 'small'
}))
```

### uniProps — per-instance mappings that can use component state

```tsx
const UniSwitch = withUnistyles(Switch)

const MyComponent = ({ isDisabled }) => (
  <UniSwitch
    uniProps={(theme, rt) => ({
      trackColor: { true: isDisabled ? theme.colors.disabled : theme.colors.primary }
    })}
  />
)
```

Priority: mappings < `uniProps` < inline props. Both mappings and `uniProps` may return a `key` (used as the React `key` to remount the component, `uniProps` wins). They can't return `style`/`contentContainerStyle` — pass those as regular props; they're auto-mapped:

```tsx
const UniScrollView = withUnistyles(ScrollView)
<UniScrollView style={styles.scroll} contentContainerStyle={styles.content} />
```

Re-renders: only when the dependencies it reads change — but on iOS/Android a wrapped component is always subscribed to theme changes. Reading `rt.insets.ime` re-renders on every keyboard animation frame. On web the component is wrapped in a `display: contents` `<div>`.

### Ref forwarding

`withUnistyles` forwards refs automatically:

```tsx
const UniInput = withUnistyles(TextInput, (theme) => ({
  placeholderTextColor: theme.colors.placeholder,
}))

const ref = useRef<TextInput>(null)
<UniInput ref={ref} />
```

---

## useUnistyles

Hook that returns the current theme and mini runtime. **Causes re-renders** of the whole component. Subscriptions are created on **property access**, not destructuring: reading any `theme.*` subscribes to theme changes, reading `rt.screen.width` subscribes to dimensions, `rt.insets.top` to insets, `rt.insets.ime` only to the keyboard (re-renders every animation frame — prefer `StyleSheet`). Respects the parent `ScopedTheme`.

```tsx
import { useUnistyles } from 'react-native-unistyles'

const MyComponent = () => {
  const { theme, rt } = useUnistyles()
  // theme: current theme object
  // rt: UnistylesMiniRuntime (screen, insets, breakpoint, colorScheme, etc.)

  return <Text style={{ color: theme.colors.text }}>{rt.breakpoint}</Text>
}
```

**Prefer `StyleSheet.create(theme => ...)` over `useUnistyles()`** for performance. Use `useUnistyles` only when you need theme/runtime values in component logic (not just styles).

---

## Display / Hide

Conditional rendering components based on media queries.

```tsx
import { Display, Hide, mq } from 'react-native-unistyles'

// Show children only when width >= 768
<Display mq={mq.only.width(768)}>
  <SidePanel />
</Display>

// Hide children when width <= 767 (bounds are inclusive)
<Hide mq={mq.only.width(null, 767)}>
  <MobileNav />
</Hide>
```

These are plain conditional renders (no wrapper view); only `Display`/`Hide` re-renders when the query result changes.

---

## ScopedTheme

Force a specific theme for a subtree, independent of the global theme.

```tsx
import { ScopedTheme } from 'react-native-unistyles'
```

Props are **mutually exclusive** — use only one:

| Prop | Type | Description |
|------|------|-------------|
| `name` | `keyof UnistylesThemes` | Force a specific theme |
| `invertedAdaptive` | `boolean` | Use the opposite adaptive theme (no-op if adaptive themes are disabled) |
| `reset` | `boolean` | Reset to the global theme (undo parent ScopedTheme) |

```tsx
// Force dark theme in this subtree
<ScopedTheme name="dark">
  <Card />
</ScopedTheme>

// Invert: if global is light, this subtree gets dark (and vice versa)
<ScopedTheme invertedAdaptive>
  <Footer />
</ScopedTheme>

// Reset to global theme (undo ancestor ScopedTheme)
<ScopedTheme reset>
  <Header />
</ScopedTheme>
```

The scoped theme is only known during render (no React Context): `UnistylesRuntime.themeName`, `useUnistyles`, `withUnistyles` and `useAnimatedTheme` respect it inside the subtree. With `Suspense`, put `ScopedTheme` inside the suspending component.

---

## Types

### UnistylesVariants\<T\>

Extract variant types from a stylesheet for use in component props:

```tsx
import type { UnistylesVariants } from 'react-native-unistyles'

const styles = StyleSheet.create(theme => ({
  button: {
    variants: {
      size: { small: { padding: 4 }, large: { padding: 16 } },
      color: { primary: { backgroundColor: 'blue' }, secondary: { backgroundColor: 'gray' } },
    }
  }
}))

type ButtonVariants = UnistylesVariants<typeof styles>
// { size?: 'small' | 'large'; color?: 'primary' | 'secondary' }
// Options of the same group are merged across styles; boolean groups infer `boolean`

type Props = { title: string } & ButtonVariants

const Button = ({ title, ...variants }: Props) => {
  styles.useVariants(variants)
  return <TouchableOpacity style={styles.button}><Text>{title}</Text></TouchableOpacity>
}
```

### UnistylesValues

The type of individual style entries in a Unistyles stylesheet.

### UnistylesMiniRuntime

Type of the `rt` argument (in `StyleSheet.create`, `useUnistyles`, `withUnistyles`): `themeName`, `breakpoint`, `hasAdaptiveThemes`, `colorScheme`, `screen`, `contentSizeCategory`, `insets`, `pixelRatio`, `fontScale`, `rtl`, `statusBar`, `navigationBar`, `isPortrait`, `isLandscape`.

```tsx
import type { UnistylesMiniRuntime } from 'react-native-unistyles'

const getHeaderHeight = (rt: UnistylesMiniRuntime) => rt.insets.top + 56
```

### Value enums: ColorScheme, Orientation, StatusBarStyle, content size categories

These are **runtime values** (TS enums), not just types:

```tsx
import {
  ColorScheme,                // Light 'light', Dark 'dark', Unspecified 'unspecified'
  Orientation,                // Portrait 'portrait', Landscape 'landscape'
  StatusBarStyle,             // Default 'default', Light 'light', Dark 'dark'
  IOSContentSizeCategory,     // AccessibilityExtraExtraExtraLarge … AccessibilityMedium,
                              // ExtraExtraExtraLarge 'xxxLarge', ExtraExtraLarge 'xxLarge', ExtraLarge 'xLarge',
                              // Large, Medium, Small, ExtraSmall 'xSmall', Unspecified 'unspecified'
  AndroidContentSizeCategory, // Small, Default, Large, ExtraLarge, Huge, ExtraHuge, ExtraExtraHuge
  WebContentSizeCategory,     // Unspecified 'web-unspecified'
  UnistylesRuntime,
} from 'react-native-unistyles'

const isDark = UnistylesRuntime.colorScheme === ColorScheme.Dark
```

### UnistyleDependency

Enum for change listener dependencies:

```tsx
import { UnistyleDependency } from 'react-native-unistyles'

// Values: Theme, ThemeName, AdaptiveThemes, Breakpoints, Variants, ColorScheme,
//         Dimensions, Orientation, ContentSizeCategory, Insets, PixelRatio,
//         FontScale, StatusBar, NavigationBar, Ime, Rtl
// Web emits only: Theme, ThemeName, AdaptiveThemes, Breakpoints, ColorScheme,
//                 Dimensions, Orientation, Rtl
```

---

## Web-Only Exports

```tsx
import { getWebProps } from 'react-native-unistyles/web'
```

### getWebProps(style, forwardedRef?)

For custom web (DOM) components. Returns `{ className, ref }` — spread both onto the element (the `ref` keeps the styles reactive; pass your forwarded ref as the 2nd argument to merge it). `className` includes any `_classNames`:

```tsx
const webProps = getWebProps([styles.container, customStyle], forwardedRef)
return <div {...webProps}>...</div>
```

---

## Reanimated Exports

```tsx
import { useAnimatedTheme, useAnimatedVariantColor } from 'react-native-unistyles/reanimated'
```

### useAnimatedTheme()

Returns a `SharedValue<Theme>` for use inside Reanimated worklets (no re-renders; follows the parent `ScopedTheme`):

```tsx
const animatedTheme = useAnimatedTheme()

const animatedStyle = useAnimatedStyle(() => ({
  backgroundColor: animatedTheme.value.colors.background,
}))
```

### useAnimatedVariantColor(style, colorKey)

Returns a derived `SharedValue<string>` with the variant's current color (`colorKey` must contain `color`/`Color`; the style must have `variants`, otherwise it throws). Use it inside `useAnimatedStyle`:

```tsx
const color = useAnimatedVariantColor(styles.button, 'backgroundColor')
const animatedStyle = useAnimatedStyle(() => ({
  backgroundColor: withTiming(color.value, { duration: 500 }),
}))
```

---

## SSR Exports

For server-side rendering with Next.js (also re-exported from the root, docs use the subpath):

```tsx
import {
  useServerUnistyles,
  getServerUnistyles,
  hydrateServerUnistyles,
  resetServerUnistyles
} from 'react-native-unistyles/server'
```

| Function | Description |
|----------|-------------|
| `useServerUnistyles(settings?)` | App Router, in a `'use client'` component with `useServerInsertedHTML`. Returns the styles once per request on the server and resets the registry; on the client it hydrates automatically |
| `getServerUnistyles(settings?)` | Pages Router (`_document` `getInitialProps`). Returns `<style>`/`<script>` elements; throws on the client |
| `hydrateServerUnistyles()` | Pages Router: call on the client (in `useEffect`); throws on the server |
| `resetServerUnistyles()` | Pages Router: call after **every** request (clears CSS, cached stylesheets, listeners) |

Settings: `{ includeRNWStyles?: boolean }` (default `true`)

---

## Native Components (Babel factories)

The Babel plugin rewrites `react-native` imports in processed files to ref-borrowing factories (no extra views, no styling of their own) so C++ can update the native views:

```tsx
// what the plugin generates — you don't write this yourself
import { View } from 'react-native-unistyles/components/native/View'
```

They are built with `createUnistylesElement(Component)` (exported from the root). On native, only the `style` prop is bound — use `withUnistyles` for `contentContainerStyle`.
