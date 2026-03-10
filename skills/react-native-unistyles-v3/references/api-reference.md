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

### StyleSheet.configure(config)

One-time initialization. Must be called before any `StyleSheet.create()`.

```tsx
StyleSheet.configure({
  themes?: { [name: string]: ThemeObject },
  breakpoints?: { [name: string]: number },  // first must be 0
  settings?: {
    initialTheme?: string | (() => string),
    adaptiveThemes?: boolean,
    CSSVars?: boolean,
    nativeBreakpointsMode?: 'pixels' | 'points',
  }
})
```

### StyleSheet utilities

| Property/Method | Description |
|----------------|-------------|
| `StyleSheet.hairlineWidth` | Thinnest visible line width (always `1` in v3) |
| `StyleSheet.absoluteFill` | Shorthand for `{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }` |
| `StyleSheet.absoluteFillObject` | Same object as `absoluteFill` |
| `StyleSheet.compose(a, b)` | Compose two styles |
| `StyleSheet.flatten(style)` | Flatten a style array into a single object |

### StyleSheet.addChangeListener(listener)

Subscribe to Unistyles dependency changes:

```tsx
const unsubscribe = StyleSheet.addChangeListener((dependencies: UnistyleDependency[]) => {
  // dependencies is an array of what changed (Theme, Breakpoints, Orientation, etc.)
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
| `colorScheme` | `'light' \| 'dark' \| 'unspecified'` | OS color scheme |
| `themeName` | `string \| undefined` | Current active theme name |
| `breakpoint` | `string \| undefined` | Current active breakpoint name |
| `hasAdaptiveThemes` | `boolean` | Whether adaptive themes are enabled |
| `screen` | `{ width: number, height: number }` | Screen dimensions |
| `insets` | `{ top, bottom, left, right, ime: number }` | Safe area insets + keyboard (ime) |
| `orientation` | `'portrait' \| 'landscape'` | Current orientation |
| `isPortrait` | `boolean` | Shorthand for portrait check |
| `isLandscape` | `boolean` | Shorthand for landscape check |
| `pixelRatio` | `number` | Device pixel ratio |
| `fontScale` | `number` | User font scale preference |
| `rtl` | `boolean` | Whether layout direction is RTL |
| `contentSizeCategory` | `IOSContentSizeCategory \| AndroidContentSizeCategory` | Accessibility text size |
| `breakpoints` | `UnistylesBreakpoints` | Registered breakpoints object |

### Sub-objects

| Property | Type | Description |
|----------|------|-------------|
| `statusBar` | `UnistylesStatusBar` | Status bar dimensions and controls |
| `navigationBar` | `UnistylesNavigationBar` | Navigation bar dimensions and controls (Android) |

### Methods

```tsx
// Switch theme
UnistylesRuntime.setTheme('dark')

// Get theme object by name
const darkTheme = UnistylesRuntime.getTheme('dark')

// Update theme values at runtime (triggers re-style of affected components)
UnistylesRuntime.updateTheme('light', currentTheme => ({
  ...currentTheme,
  colors: { ...currentTheme.colors, primary: '#ff0000' }
}))

// Enable/disable adaptive themes
UnistylesRuntime.setAdaptiveThemes(true)

// Set root view background color
UnistylesRuntime.setRootViewBackgroundColor('#ffffff')

// Enable immersive mode (hide status bar + navigation bar)
UnistylesRuntime.setImmersiveMode(true)
```

---

## StatusBar

```tsx
import { StatusBar } from 'react-native-unistyles'
```

| Property/Method | Type | Description |
|----------------|------|-------------|
| `width` | `number` | Status bar width |
| `height` | `number` | Status bar height |
| `setHidden(hidden, animation?)` | `(boolean, 'none' \| 'fade' \| 'slide') => void` | Show/hide status bar |
| `setStyle(style, animated?)` | `('default' \| 'light' \| 'dark', boolean?) => void` | Set status bar style |

Also accessible via `UnistylesRuntime.statusBar`.

---

## NavigationBar

```tsx
import { NavigationBar } from 'react-native-unistyles'
```

| Property/Method | Type | Description |
|----------------|------|-------------|
| `width` | `number` | Navigation bar width |
| `height` | `number` | Navigation bar height |
| `setHidden(hidden)` | `(boolean) => void` | Show/hide navigation bar (Android) |

Also accessible via `UnistylesRuntime.navigationBar`.

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
- **Breakpoint names**: `'sm'`, `'md'`, `'lg'` (from registered breakpoints)
- **Pixel values**: `320`, `768`, `1200`
- **`null`/`undefined`**: unbounded (no min or no max)

### Examples

```tsx
mq.only.width('sm', 'md')           // width between sm and md breakpoints
mq.only.width(320, 768)             // width between 320px and 768px
mq.only.width('sm')                 // width >= sm (no max)
mq.only.width(null, 600)            // width <= 600px
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

### With uniProps — dynamic mappings from component props

The wrapped component receives additional `uniProps` that map to theme-derived values:

```tsx
const UniIcon = withUnistyles(Icon, (theme) => ({
  // These become available as props on UniIcon
}))

// The style and contentContainerStyle props are auto-processed
<UniIcon style={styles.icon} />
```

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

Hook that returns the current theme and mini runtime. **Causes re-renders** when theme or runtime values change.

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

// Hide children when width < 768
<Hide mq={mq.only.width(null, 768)}>
  <MobileNav />
</Hide>
```

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
| `invertedAdaptive` | `boolean` | Use the opposite adaptive theme |
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

type Props = { title: string } & ButtonVariants

const Button = ({ title, ...variants }: Props) => {
  styles.useVariants(variants)
  return <TouchableOpacity style={styles.button}><Text>{title}</Text></TouchableOpacity>
}
```

### UnistylesValues

The type of individual style entries in a Unistyles stylesheet.

### IOSContentSizeCategory / AndroidContentSizeCategory

Enums for accessibility text size categories:

```tsx
import type { IOSContentSizeCategory, AndroidContentSizeCategory } from 'react-native-unistyles'

// iOS values: 'accessibilityExtraExtraExtraLarge', 'xxxLarge', 'xxLarge', 'xLarge',
//             'Large', 'Medium', 'Small', 'xSmall', 'unspecified'
// Android values: 'Small', 'Default', 'Large', 'ExtraLarge', 'Huge', 'ExtraHuge', 'ExtraExtraHuge'
```

### UnistyleDependency

Enum for change listener dependencies:

```tsx
import { UnistyleDependency } from 'react-native-unistyles'

// Values: Theme, ThemeName, Breakpoints, ColorScheme, ContentSizeCategory,
//         Orientation, Insets, Ime, PixelRatio, FontScale, Rtl,
//         NavigationBar, StatusBar, Dimensions, AdaptiveThemes
```

---

## Web-Only Exports

```tsx
import { getWebProps } from 'react-native-unistyles/web-only'
```

### getWebProps(style)

For custom web components that don't support Unistyles' auto-processing:

```tsx
const { className, style: webStyle } = getWebProps(styles.container)
return <div className={className} style={webStyle}>...</div>
```

---

## Reanimated Exports

```tsx
import { useAnimatedTheme, useAnimatedVariantColor } from 'react-native-unistyles/reanimated'
```

### useAnimatedTheme()

Returns a `SharedValue<Theme>` for use inside Reanimated worklets:

```tsx
const animatedTheme = useAnimatedTheme()

const animatedStyle = useAnimatedStyle(() => ({
  backgroundColor: animatedTheme.value.colors.background,
}))
```

### useAnimatedVariantColor(style, colorKey)

Animate color transitions when variants change:

```tsx
const animatedColor = useAnimatedVariantColor(styles.button, 'backgroundColor')
```

---

## SSR Exports

For server-side rendering with Next.js:

```tsx
import {
  useServerUnistyles,
  getServerUnistyles,
  hydrateServerUnistyles,
  resetServerUnistyles
} from 'react-native-unistyles'
```

| Function | Description |
|----------|-------------|
| `useServerUnistyles(settings?)` | React hook returning style elements for SSR (App Router) |
| `getServerUnistyles(settings?)` | Returns React element with styles for SSR (Pages Router) |
| `hydrateServerUnistyles()` | Call on client to hydrate server-rendered styles |
| `resetServerUnistyles()` | Reset server styles between requests |

Settings: `{ includeRNWStyles?: boolean }`

---

## Native Components

Pre-styled components that work with Unistyles out of the box:

```tsx
import { View } from 'react-native-unistyles/components/native/View'
import { Text } from 'react-native-unistyles/components/native/Text'
import { Pressable } from 'react-native-unistyles/components/native/Pressable'
// etc.
```

These are automatically created by the Babel plugin — you typically don't import them directly. They exist for edge cases where the plugin can't detect a component.
