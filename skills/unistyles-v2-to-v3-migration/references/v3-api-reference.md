# v3 API Reference

## StyleSheet

The main API. Import from `react-native-unistyles`.

```tsx
import { StyleSheet } from 'react-native-unistyles'
```

### StyleSheet.create(styles)

Creates a reactive stylesheet. Three overloads:

**1. Static object:**
```tsx
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16
  }
})
```

**2. Theme function:**
```tsx
const styles = StyleSheet.create(theme => ({
  container: {
    backgroundColor: theme.colors.background
  }
}))
```

**3. Theme + miniRuntime function:**
```tsx
const styles = StyleSheet.create((theme, rt) => ({
  container: {
    backgroundColor: theme.colors.background,
    paddingTop: rt.insets.top,
    paddingBottom: rt.insets.bottom,
    width: rt.screen.width > 768 ? 500 : rt.screen.width - 32
  }
}))
```

**Return type:** An object with the same keys as your stylesheet, plus `useVariants(variants)` method. Each style value is a C++ proxy object.

**Dynamic functions in StyleSheet.create:**
```tsx
const styles = StyleSheet.create(theme => ({
  // Regular style
  container: { flex: 1 },

  // Dynamic function - receives args at call site
  box: (width: number, color: string) => ({
    width,
    backgroundColor: color
  }),

  // Dynamic function with theme
  card: (isActive: boolean) => ({
    backgroundColor: isActive ? theme.colors.active : theme.colors.inactive
  })
}))

// Usage:
<View style={styles.box(200, 'red')} />
<View style={styles.card(true)} />
```

Dynamic function arguments must be serializable (strings, numbers, booleans, `null`, `undefined`, plain arrays/objects). They are stored in C++ and the function may be re-run natively with the stored copy, so functions are dropped and `Date` / `Map` / `Set` / class instances become plain objects.

### StyleSheet.configure(config)

One-time configuration. Call it before any `StyleSheet.create` is evaluated (import the config file first in your app entry point).

```tsx
StyleSheet.configure({
  themes?: {
    [themeName: string]: ThemeObject
  },
  breakpoints?: {
    [breakpointName: string]: number  // first must be 0
  },
  settings?: {
    // Pick ONE of these theme options:
    initialTheme?: keyof UnistylesThemes | (() => keyof UnistylesThemes),
    // OR
    adaptiveThemes?: boolean,  // requires 'light' and 'dark' theme names

    // Additional settings:
    CSSVars?: boolean,                    // default: true (web only)
    nativeBreakpointsMode?: 'pixels' | 'points'  // default: 'pixels'
  }
})
```

- `settings` accepts only these four keys — any other key throws (`StyleSheet.configure's settings received unexpected key`).
- `initialTheme` together with `adaptiveThemes: true` throws (mutually exclusive). `adaptiveThemes: true` throws if `light` and `dark` themes aren't both registered.
- The first (smallest) breakpoint must be `0`.
- `nativeBreakpointsMode: 'pixels'` (default) compares breakpoints and `mq` against `UnistylesRuntime.screen`, which is in density-independent units (pt on iOS, dp on Android). `'points'` additionally divides the screen size by `pixelRatio`.

### StyleSheet.addChangeListener(callback)

`StyleSheet.addChangeListener((dependencies: Array<UnistyleDependency>) => void)` returns an unsubscribe function. `UnistyleDependency` is exported from `react-native-unistyles`.

### StyleSheet.hairlineWidth

Thinnest drawable line on the device (replacement for `UnistylesRuntime.hairlineWidth`).

```tsx
const styles = StyleSheet.create({
  divider: {
    height: StyleSheet.hairlineWidth
  }
})
```

### StyleSheet.absoluteFill / StyleSheet.absoluteFillObject

Same as React Native's `StyleSheet.absoluteFill` and `StyleSheet.absoluteFillObject`.

### StyleSheet.compose / StyleSheet.flatten

Pass-through to React Native's `StyleSheet.compose` and `StyleSheet.flatten`.

---

## Breakpoints

Define breakpoints in `StyleSheet.configure`. Use as keys in style values:

```tsx
StyleSheet.configure({
  breakpoints: { xs: 0, sm: 576, md: 768, lg: 992, xl: 1200 }
})

const styles = StyleSheet.create(theme => ({
  container: {
    padding: {
      xs: 8,
      sm: 16,
      md: 24,
      lg: 32
    },
    flexDirection: {
      xs: 'column',
      md: 'row'
    }
  }
}))
```

Works with nested properties too:

```tsx
const styles = StyleSheet.create({
  box: {
    transform: [
      { translateX: { xs: 0, md: 100 } }
    ],
    shadowOffset: {
      width: { xs: 0, md: 2 },
      height: { xs: 1, md: 4 }
    }
  }
})
```

---

## Variants

Define variants inside any style in `StyleSheet.create`:

```tsx
const styles = StyleSheet.create(theme => ({
  button: {
    // Base styles (always applied)
    borderRadius: 8,

    // Variant groups
    variants: {
      size: {
        small: { padding: 4, fontSize: 12 },
        medium: { padding: 8, fontSize: 14 },
        large: { padding: 16, fontSize: 18 },
        default: { padding: 8, fontSize: 14 }  // fallback when no variant selected
      },
      intent: {
        primary: { backgroundColor: theme.colors.primary },
        danger: { backgroundColor: theme.colors.danger },
        default: { backgroundColor: theme.colors.neutral }
      }
    },

    // Compound variants (applied when multiple conditions match)
    compoundVariants: [
      {
        size: 'small',
        intent: 'danger',
        styles: {
          borderWidth: 2,
          borderColor: theme.colors.dangerBorder
        }
      }
    ]
  }
}))
```

### styles.useVariants(selection)

Call at the top of your component (before accessing variant-dependent styles):

```tsx
const MyButton = ({ size, intent }) => {
  styles.useVariants({ size, intent })
  return <TouchableOpacity style={styles.button} />
}
```

- Always pass an object. `styles.useVariants({})` selects `default` variants; `styles.useVariants(undefined)` throws on iOS/Android.
- A variant value of `undefined` (or `null`) falls back to `default`.
- If `useVariants` is never called, variants are ignored entirely (even `default`).
- Variant names can be numbers (`1`, `2`); on native they are converted to integers.

### Boolean variants

```tsx
variants: {
  disabled: {
    true: { opacity: 0.5 },
    false: { opacity: 1 }
  }
}

// Usage:
styles.useVariants({ disabled: true })
styles.useVariants({ disabled: isDisabled }) // boolean variable works
```

### UnistylesVariants type

Extract variant types from a stylesheet:

```tsx
import type { UnistylesVariants } from 'react-native-unistyles'

type ButtonVariants = UnistylesVariants<typeof styles>
// { size?: 'small' | 'medium' | 'large', intent?: 'primary' | 'danger' }
```

---

## withUnistyles(Component, mappings?)

Higher-order component for wrapping components that need theme/runtime-derived props.

```tsx
import { withUnistyles } from 'react-native-unistyles'
```

### Basic usage (static mappings)

```tsx
const UniButton = withUnistyles(Button, (theme, rt) => ({
  color: theme.colors.primary,
  size: rt.screen.width > 768 ? 'large' : 'small'
}))

<UniButton label="Click me" />
```

### With uniProps (per-instance dynamic mappings)

```tsx
const UniButton = withUnistyles(Button)

<UniButton
  label="Click me"
  uniProps={(theme) => ({
    color: theme.colors.secondary
  })}
/>
```

### Supported style props

`withUnistyles` automatically processes `style` and `contentContainerStyle` props, extracting Unistyles proxy data. These two props can't be returned from `mappings` / `uniProps` — pass them as regular props.

### Re-renders

The wrapped component re-renders only when its dependencies change. On iOS/Android it is always subscribed to theme changes, so it also re-renders on every theme change. On the web it is wrapped in a `<div style="display: contents">` holding the generated `className`.

### Ref forwarding

`withUnistyles` forwards refs:

```tsx
const UniInput = withUnistyles(TextInput, (theme) => ({
  placeholderTextColor: theme.colors.placeholder
}))

const inputRef = useRef<TextInput>(null)
<UniInput ref={inputRef} />
```

### Mappings function signature

```tsx
(theme: UnistylesTheme, rt: UnistylesMiniRuntime) => Partial<ComponentProps> & { key?: string }
```

The optional `key` isn't passed down as a prop — it becomes the React `key` of the wrapped component, so changing it remounts the component. `uniProps` can return a `key` too; if both do, `uniProps` wins.

---

## useUnistyles()

Hook that provides reactive theme and runtime access. Causes re-renders.

```tsx
import { useUnistyles } from 'react-native-unistyles'

const MyComponent = () => {
  const { theme, rt } = useUnistyles()

  return (
    <View>
      <Text style={{ color: theme.colors.text }}>
        Screen: {rt.screen.width}x{rt.screen.height}
      </Text>
    </View>
  )
}
```

**Returns:**
- `theme: UnistylesTheme` - current theme object (reactive, respects parent `ScopedTheme`)
- `rt: UnistylesMiniRuntime` - proxified mini runtime (reactive; no setters — use `UnistylesRuntime` for those)

Subscriptions are created on property access, not on destructuring: reading any `theme` property subscribes to theme changes, reading `rt.screen.width` subscribes to dimension changes, reading `rt.insets.ime` subscribes only to keyboard changes (and re-renders on every keyboard animation frame).

**Warning:** This hook re-renders the whole component whenever a value you read changes. Prefer `StyleSheet.create(theme => ...)` or `withUnistyles` for better performance.

---

## UnistylesRuntime

Singleton providing runtime information and control methods.

```tsx
import { UnistylesRuntime } from 'react-native-unistyles'
```

### Read-only properties

| Property | Type | Description |
|----------|------|-------------|
| `colorScheme` | `ColorScheme` (`'light' \| 'dark' \| 'unspecified'`) | Device color scheme |
| `hasAdaptiveThemes` | `boolean` | Whether adaptive themes are enabled |
| `screen` | `{ width, height }` | Screen dimensions (pt on iOS, dp on Android) |
| `themeName` | `string \| undefined` | Current theme name (scoped theme name when read during render inside `ScopedTheme`) |
| `contentSizeCategory` | `IOSContentSizeCategory \| AndroidContentSizeCategory \| WebContentSizeCategory` | Accessibility text size (enums exported as values) |
| `breakpoint` | `string \| undefined` | Current active breakpoint |
| `breakpoints` | `Record<string, number>` | Registered breakpoints |
| `insets` | `{ top, left, right, bottom, ime }` | Safe area + keyboard insets |
| `orientation` | `Orientation` (`'portrait' \| 'landscape'`) | Device orientation |
| `pixelRatio` | `number` | Screen pixel ratio |
| `fontScale` | `number` | User font scale preference |
| `rtl` | `boolean` | Right-to-left layout direction |
| `isLandscape` | `boolean` | Convenience boolean |
| `isPortrait` | `boolean` | Convenience boolean |

### Sub-objects

**`UnistylesRuntime.statusBar`:**
- `.width` (number, read-only)
- `.height` (number, read-only)
- `.setHidden(hidden: boolean, animation?: 'none' | 'fade' | 'slide')` (`animation` is used on iOS)
- `.setStyle(style: StatusBarStyle, animated?: boolean)` — `StatusBarStyle.Default | StatusBarStyle.Light | StatusBarStyle.Dark` (enum exported from `react-native-unistyles`)

**`UnistylesRuntime.navigationBar`** (Android only; dimensions are always `0` on iOS and web):
- `.width` (number, read-only)
- `.height` (number, read-only)
- `.setHidden(hidden: boolean)`

```tsx
import { UnistylesRuntime, StatusBarStyle } from 'react-native-unistyles'

UnistylesRuntime.statusBar.setStyle(StatusBarStyle.Light, true)
UnistylesRuntime.statusBar.setHidden(true, 'slide')
```

There are no standalone status bar / navigation bar exports — use `UnistylesRuntime.statusBar` / `UnistylesRuntime.navigationBar`.

### Methods

| Method | Description |
|--------|-------------|
| `setTheme(name)` | Switch to a registered theme |
| `getTheme(name?)` | Get theme object by name (or current if omitted) |
| `updateTheme(name, updater)` | Modify a theme: `(currentTheme) => newTheme` |
| `setAdaptiveThemes(enabled)` | Enable/disable adaptive theme switching |
| `setRootViewBackgroundColor(color?)` | Set root view background (any React Native color; omit to reset to transparent) |
| `setImmersiveMode(enabled)` | Android: hide/show status + navigation bars. iOS: hide/show status bar only (`fade`) |

On the web, the system bar setters and `setImmersiveMode` are no-ops, and `setRootViewBackgroundColor` sets the `html` element background.

---

## mq (Media Queries)

```tsx
import { mq } from 'react-native-unistyles'
```

Returns symbols used as keys in style objects alongside breakpoints.

### API

```tsx
mq.only.width(min?, max?)     // width range only
mq.only.height(min?, max?)    // height range only
mq.width(min?, max?).and.height(min?, max?)  // both dimensions
mq.height(min?, max?).and.width(min?, max?)  // both dimensions
```

### Values

- Numbers: same units as `UnistylesRuntime.screen` (e.g., `200`, `800`)
- Strings: breakpoint names (e.g., `'sm'`, `'xl'`) — resolved when `mq` is called, so `StyleSheet.configure` must run first; unknown names resolve to `0`
- `null` or `undefined` for min: starts from 0
- Omitted max: extends to infinity
- Both ends are inclusive: `mq.only.width(100, 200)` matches 100–200, so `(240, 380)` and `(380)` both match a 380-wide screen (on native the first matching query wins)
- Invalid ranges (e.g. `('xl', 'sm')`) are ignored

### Usage in styles

```tsx
const styles = StyleSheet.create(theme => ({
  container: {
    backgroundColor: {
      [mq.only.width(0, 'md')]: theme.colors.mobile,
      [mq.only.width('md')]: theme.colors.desktop
    }
  }
}))
```

Media queries have higher priority than breakpoints when both match.

---

## Display / Hide Components

Conditionally render children based on media queries.

```tsx
import { Display, Hide, mq } from 'react-native-unistyles'

// Show only on screens 768 wide or wider
<Display mq={mq.only.width(768)}>
  <DesktopSidebar />
</Display>

// Hide on screens 768 wide or wider
<Hide mq={mq.only.width(768)}>
  <MobileMenu />
</Hide>
```

Both accept a single prop `mq` which is a symbol returned by the `mq` utility.

---

## ScopedTheme

Force a component subtree to use a specific theme.

```tsx
import { ScopedTheme } from 'react-native-unistyles'
```

### Props (mutually exclusive)

| Prop | Type | Description |
|------|------|-------------|
| `name` | `keyof UnistylesThemes` | Force a specific named theme |
| `invertedAdaptive` | `boolean` | Invert the adaptive theme (light <-> dark); no effect if adaptive themes are disabled |
| `reset` | `boolean` | Reset to global theme (undo parent ScopedTheme) |

```tsx
<ScopedTheme name="dark">
  <DarkThemedSection />
</ScopedTheme>

<ScopedTheme invertedAdaptive>
  <InvertedSection />
</ScopedTheme>

<ScopedTheme name="dark">
  <OuterDark>
    <ScopedTheme reset>
      <BackToGlobal />
    </ScopedTheme>
  </OuterDark>
</ScopedTheme>
```

---

## Web Features

### _web property

Add web-only CSS properties to any style:

```tsx
const styles = StyleSheet.create({
  button: {
    padding: 16,
    _web: {
      cursor: 'pointer',
      userSelect: 'none',
      transition: 'all 0.2s ease',
      _hover: {
        opacity: 0.8
      },
      _active: {
        transform: 'scale(0.98)'
      },
      _focus: {
        outline: '2px solid blue'
      },
      _disabled: {
        opacity: 0.5,
        cursor: 'not-allowed'
      }
    }
  }
})
```

All standard (non-experimental) CSS pseudo-classes and pseudo-elements are supported with a `_` prefix, e.g. `_hover`, `_active`, `_focus`, `_focus-visible`, `_disabled`, `_nth-child(2n)`, `_before`, `_after`. Breakpoints work inside `_web`, but variants can't be defined inside `_web` — put a `_web` block inside a variant instead.

### _classNames

Bind custom CSS class names:

```tsx
const styles = StyleSheet.create({
  container: {
    _web: {
      _classNames: 'my-custom-class another-class'
      // or: _classNames: ['my-custom-class', 'another-class']
    }
  }
})
```

### getWebProps

For custom HTML elements (not React Native components):

```tsx
import { getWebProps } from 'react-native-unistyles/web'

const MyDiv = forwardRef((props, ref) => {
  const { className, ref: uniRef } = getWebProps(styles.container, ref)
  return <div {...props} className={className} ref={uniRef} />
})
```

`getWebProps(style, forwardedRef?)` returns `{ className, ref }`; `className` also includes classes from `_classNames`, and the forwarded ref is merged with Unistyles' own ref.

### SSR (Next.js)

`useServerUnistyles` (App Router), `getServerUnistyles` / `resetServerUnistyles` / `hydrateServerUnistyles` (Pages Router) are exported from `react-native-unistyles/server` (also re-exported from the root). `getServerUnistyles()` returns React elements (`<style>` tags + a hydration `<script>`), not a CSS string. See https://www.unistyl.es/v3/guides/server-side-rendering.

---

## Reanimated Integration

Import from `react-native-unistyles/reanimated`:

```tsx
import { useAnimatedTheme, useAnimatedVariantColor } from 'react-native-unistyles/reanimated'
```

### useAnimatedTheme()

Returns a shared value containing the current theme (or the parent `ScopedTheme`'s theme). Usable in worklets.

```tsx
const animatedTheme = useAnimatedTheme()

const animatedStyle = useAnimatedStyle(() => ({
  backgroundColor: animatedTheme.value.colors.background
}))

// CRITICAL: Never spread Unistyles + Reanimated together. Use array:
<Animated.View style={[styles.container, animatedStyle]} />
```

### useAnimatedVariantColor(style, colorKey)

Animates color changes when variants change:

```tsx
const derivedColor = useAnimatedVariantColor(styles.button, 'backgroundColor')

const animatedStyle = useAnimatedStyle(() => ({
  backgroundColor: derivedColor.value
}))

<Animated.View style={[styles.button, animatedStyle]} />
```

Requirements: The style must be created by Unistyles, have variants, and the color key must contain "color" (case-insensitive).

---

## Babel Plugin Configuration

```js
// babel.config.js
module.exports = {
  plugins: [
    ['react-native-unistyles/plugin', {
      // REQUIRED: root folder of your app source (relative to Babel's root,
      // can't be the project root itself). Every file under it is processed.
      root: 'src',

      // Optional: also process files (outside root) containing these imports (exact source match)
      autoProcessImports: ['@myorg/design-system'],

      // Optional: process these paths (typically node_modules packages); matched as a
      // substring of the file path. Always includes 'react-native-reanimated/src/component'
      // and 'react-native-reanimated/lib/module/component'; yours are added to them
      autoProcessPaths: ['custom-library/components'],

      // Optional: remap exotic imports to Unistyles factories
      autoRemapImports: [{
        path: 'node_modules/custom-library/components',
        imports: [{
          name: 'CustomView',
          isDefault: false,
          path: 'custom-library/components/CustomView',
          mapTo: 'NativeView'
        }]
      }],

      // Optional: log detected dependencies
      debug: false
    }]
  ]
}
```

Outside `root`, files are processed only if they import `react-native-unistyles`, contain an `autoProcessImports` import, or match `autoProcessPaths`. The plugin replaces `react-native` component imports with Unistyles component factories that borrow the native ref; it does not inject unique ids into StyleSheets. String refs (`ref="x"`) throw. The plugin is a no-op when `NODE_ENV=test`.

**Re.Pack:** instead of `babel.config.js`, register the loader plugin:

```js
// rspack.config.mjs
import { RepackUnistylePlugin } from 'react-native-unistyles/repack-plugin'

plugins: [
  new Repack.RepackPlugin(),
  new RepackUnistylePlugin({ unistylesPluginOptions: { root: 'src' } })
]
```

It requires `@babel/plugin-syntax-typescript` and `babel-plugin-syntax-hermes-parser` to be installed.

---

## TypeScript Setup

```tsx
// unistyles.d.ts (or in your config file)
import { lightTheme, darkTheme } from './themes'
import { breakpoints } from './breakpoints'

type AppThemes = {
  light: typeof lightTheme
  dark: typeof darkTheme
}
type AppBreakpoints = typeof breakpoints

declare module 'react-native-unistyles' {
  export interface UnistylesThemes extends AppThemes {}
  export interface UnistylesBreakpoints extends AppBreakpoints {}
}
```

This enables autocomplete for theme properties and breakpoint keys throughout your codebase. (`interface X extends typeof y` is invalid TypeScript — use a type alias.)

Other exports: value enums `ColorScheme`, `Orientation`, `StatusBarStyle`, `IOSContentSizeCategory`, `AndroidContentSizeCategory`, `WebContentSizeCategory`, `UnistyleDependency`; types `UnistylesVariants`, `UnistylesValues`, `UnistylesMiniRuntime` (use it to type helpers that receive `rt`).

---

## Testing Setup

```js
// jest.config.js
module.exports = {
  setupFiles: [
    'react-native-unistyles/mocks',
    './unistyles.ts' // your StyleSheet.configure() call - must come AFTER the mocks
  ]
}
```

The mocks file mocks `react-native-nitro-modules`, `react-native-unistyles` and `react-native-unistyles/reanimated`:
- `StyleSheet` (create, configure, hairlineWidth, etc.)
- `UnistylesRuntime` (properties and methods; dimensions/insets are `0`)
- `withUnistyles` (passes through props + mapper results)
- `useUnistyles` (returns first registered theme)
- `mq` (returns empty objects)
- `Display`, `Hide`, `ScopedTheme` (render nothing)
- Enums (`ColorScheme`, `Orientation`, `StatusBarStyle`, content size categories)
- Reanimated hooks (`useAnimatedTheme`, `useAnimatedVariantColor`)

Limitations: styles always resolve with the **first** registered theme (`initialTheme` / `adaptiveThemes` ignored), `variants` / `compoundVariants` are stripped and `useVariants` is a no-op, and `createUnistylesElement`, `UnistyleDependency` and the SSR helpers are not mocked (`undefined`).
