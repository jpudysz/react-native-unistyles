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

### StyleSheet.configure(config)

One-time configuration. Call before any component renders (typically in app entry point).

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

`withUnistyles` automatically processes `style` and `contentContainerStyle` props, extracting Unistyles proxy data.

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

The optional `key` prop forces React to remount the component when it changes.

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
- `theme: UnistylesTheme` - current theme object (reactive)
- `rt: UnistylesRuntime` - proxified runtime (reactive)

**Warning:** This hook triggers re-renders. Prefer `StyleSheet.create(theme => ...)` or `withUnistyles` for better performance.

---

## UnistylesRuntime

Singleton providing runtime information and control methods.

```tsx
import { UnistylesRuntime } from 'react-native-unistyles'
```

### Read-only properties

| Property | Type | Description |
|----------|------|-------------|
| `colorScheme` | `'light' \| 'dark' \| 'unspecified'` | Device color scheme |
| `hasAdaptiveThemes` | `boolean` | Whether adaptive themes are enabled |
| `screen` | `{ width, height }` | Screen dimensions |
| `themeName` | `string \| undefined` | Current theme name |
| `contentSizeCategory` | `string` | Accessibility text size |
| `breakpoint` | `string \| undefined` | Current active breakpoint |
| `breakpoints` | `Record<string, number>` | Registered breakpoints |
| `insets` | `{ top, left, right, bottom, ime }` | Safe area + keyboard insets |
| `orientation` | `'portrait' \| 'landscape'` | Device orientation |
| `pixelRatio` | `number` | Screen pixel ratio |
| `fontScale` | `number` | User font scale preference |
| `rtl` | `boolean` | Right-to-left layout direction |
| `isLandscape` | `boolean` | Convenience boolean |
| `isPortrait` | `boolean` | Convenience boolean |

### Sub-objects

**`UnistylesRuntime.statusBar`:**
- `.width` (number, read-only)
- `.height` (number, read-only)
- `.setHidden(hidden: boolean, animation?: 'fade' | 'slide' | 'none')` (iOS)
- `.setStyle(style: 'light' | 'dark')`

**`UnistylesRuntime.navigationBar`:**
- `.width` (number, read-only)
- `.height` (number, read-only)
- `.setHidden(hidden: boolean)` (Android)

### Methods

| Method | Description |
|--------|-------------|
| `setTheme(name)` | Switch to a registered theme |
| `getTheme(name?)` | Get theme object by name (or current if omitted) |
| `updateTheme(name, updater)` | Modify a theme: `(currentTheme) => newTheme` |
| `setAdaptiveThemes(enabled)` | Enable/disable adaptive theme switching |
| `setRootViewBackgroundColor(color?)` | Set root view background (string color or undefined to reset) |
| `setImmersiveMode(enabled)` | Hide/show status bar + navigation bar |

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

- Numbers: pixel values (e.g., `200`, `800`)
- Strings: breakpoint names (e.g., `'sm'`, `'xl'`)
- `null` or `undefined` for min: starts from 0
- Omitted max: extends to infinity

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

// Show only on screens wider than 768px
<Display mq={mq.only.width(768)}>
  <DesktopSidebar />
</Display>

// Hide on screens wider than 768px
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
| `invertedAdaptive` | `boolean` | Invert the adaptive theme (light <-> dark) |
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

Supported pseudo-classes: `_hover`, `_active`, `_focus`, `_disabled`, `_focus-visible`, `_focus-within`.

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
import { getWebProps } from 'react-native-unistyles/web-only'

const MyDiv = forwardRef((props, ref) => {
  const { className, ref: uniRef } = getWebProps(styles.container, ref)
  return <div className={className} ref={uniRef} {...props} />
})
```

---

## Reanimated Integration

Import from `react-native-unistyles/reanimated`:

```tsx
import { useAnimatedTheme, useAnimatedVariantColor } from 'react-native-unistyles/reanimated'
```

### useAnimatedTheme()

Returns a shared value containing the current theme. Usable in worklets.

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
      // REQUIRED: root folder of your app source
      root: 'src',

      // Optional: process files containing these imports
      autoProcessImports: ['@myorg/design-system'],

      // Optional: process these node_modules paths
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

The plugin auto-disables when `NODE_ENV=test`.

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

declare module 'react-native-unistyles' {
  export interface UnistylesThemes extends AppThemes {}
  export interface UnistylesBreakpoints extends typeof breakpoints {}
}
```

This enables autocomplete for theme properties and breakpoint keys throughout your codebase.

---

## Testing Setup

```js
// jest.config.js
module.exports = {
  setupFiles: ['./jest.setup.js']
}

// jest.setup.js
require('react-native-unistyles/mocks')
require('./unistyles.config') // your StyleSheet.configure() call
```

The mocks file provides complete mock implementations for:
- `StyleSheet` (create, configure, hairlineWidth, etc.)
- `UnistylesRuntime` (all properties and methods)
- `withUnistyles` (passes through props + mapper results)
- `useUnistyles` (returns first registered theme)
- `mq` (returns empty objects)
- `Display`, `Hide`, `ScopedTheme` (return null/children)
- Reanimated hooks (`useAnimatedTheme`, `useAnimatedVariantColor`)
