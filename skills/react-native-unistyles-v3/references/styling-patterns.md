# Styling Patterns

Comprehensive patterns and code examples for react-native-unistyles v3.

## Basic Stylesheet

### Static styles (no theme)

```tsx
import { StyleSheet } from 'react-native-unistyles'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
})
```

### Theme-aware styles (zero re-renders)

```tsx
const styles = StyleSheet.create(theme => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.fontSize.lg,
  },
}))
```

### Theme + runtime styles (zero re-renders)

```tsx
const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: rt.insets.top,
    paddingBottom: rt.insets.bottom,
  },
  hero: {
    width: rt.screen.width,
    height: rt.screen.height * 0.4,
  },
}))
```

---

## Dynamic Functions

Pass arguments to styles at the call site. Arguments must be serializable: Unistyles stores them in C++ and re-runs the function natively (theme/runtime changes, frozen screens re-linking). Functions are dropped and `Date`/`Map`/`Set`/class instances become plain objects — pass primitives or plain objects instead (e.g. `date.getTime()`).

```tsx
const styles = StyleSheet.create(theme => ({
  // Single argument
  avatar: (size: number) => ({
    width: size,
    height: size,
    borderRadius: size / 2,
  }),

  // Multiple arguments
  badge: (color: string, isActive: boolean) => ({
    backgroundColor: isActive ? color : theme.colors.disabled,
    opacity: isActive ? 1 : 0.5,
  }),

  // Conditional with theme
  card: (elevation: number) => ({
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    shadowOpacity: elevation * 0.1,
    shadowRadius: elevation * 2,
  }),
}))

// Usage in JSX:
<Image style={styles.avatar(48)} />
<View style={styles.badge('#ff0000', true)} />
<View style={styles.card(3)} />
```

---

## Breakpoint-Based Responsive Styles

Register breakpoints in `StyleSheet.configure`, then use breakpoint names as keys in style values:

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
      lg: 32,
    },
    flexDirection: {
      xs: 'column',
      md: 'row',
    },
  },
  sidebar: {
    display: {
      xs: 'none',
      md: 'flex',
    },
    width: {
      md: 250,
      lg: 300,
    },
  },
}))
```

### Nested breakpoints (transform, shadowOffset, filter)

For properties expecting objects (like `transform`, `shadowOffset` or `filter`), use breakpoints at the nested level:

```tsx
const styles = StyleSheet.create({
  box: {
    transform: [
      { translateX: { xs: 0, md: 50 } },
      { scale: { xs: 0.8, lg: 1 } },
    ],
    shadowOffset: {
      width: { xs: 1, md: 2 },
      height: { xs: 1, md: 4 },
    },
  },
})
```

### Built-in breakpoints: landscape / portrait

Unistyles has built-in `landscape` (width > height) and `portrait` (height >= width) breakpoints. On iOS/Android they're only available when you **haven't registered your own breakpoints**; on web they always become `@media (orientation: ...)` queries:

```tsx
const styles = StyleSheet.create({
  grid: {
    flexDirection: {
      portrait: 'column',
      landscape: 'row',
    },
    gap: {
      portrait: 8,
      landscape: 16,
    },
  },
})
```

---

## Variants

Variants allow conditional style groups selected at the component level.

### Basic variants

```tsx
const styles = StyleSheet.create(theme => ({
  button: {
    borderRadius: theme.radius.md,
    variants: {
      size: {
        small: { paddingVertical: 4, paddingHorizontal: 8 },
        medium: { paddingVertical: 8, paddingHorizontal: 16 },
        large: { paddingVertical: 12, paddingHorizontal: 24 },
      },
      variant: {
        filled: { backgroundColor: theme.colors.primary },
        outlined: { borderWidth: 1, borderColor: theme.colors.primary },
        ghost: { backgroundColor: 'transparent' },
      },
    },
  },
}))

const Button = ({ size = 'medium', variant = 'filled', children }) => {
  styles.useVariants({ size, variant })
  return <TouchableOpacity style={styles.button}><Text>{children}</Text></TouchableOpacity>
}
```

### Boolean variants

```tsx
const styles = StyleSheet.create(theme => ({
  card: {
    padding: theme.spacing.md,
    variants: {
      elevated: {
        true: { shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
        false: { shadowOpacity: 0 },
      },
      disabled: {
        true: { opacity: 0.5 },
      },
    },
  },
}))

styles.useVariants({ elevated: true, disabled: false })
```

### Default variant values

Use the `default` key for a fallback when no variant is selected:

```tsx
const styles = StyleSheet.create(theme => ({
  text: {
    variants: {
      weight: {
        default: { fontWeight: 'normal' },
        bold: { fontWeight: 'bold' },
        light: { fontWeight: '300' },
      },
    },
  },
}))

// No variant selected → uses 'default'
styles.useVariants({})
```

- Always pass an object — `useVariants(undefined)` throws on native.
- `undefined` and `null` values fall back to `default`; boolean `false` is NOT `default`.
- Without any `useVariants` call, variants (including `default`) are ignored.

### Numeric variant keys

```tsx
const styles = StyleSheet.create({
  heading: {
    variants: {
      level: {
        1: { fontSize: 32 },
        2: { fontSize: 24 },
      },
    },
  },
})

styles.useVariants({ level: 1 })  // use whole numbers (converted to integers on native)
```

### Compound variants

Apply styles only when multiple variant values match simultaneously:

```tsx
const styles = StyleSheet.create(theme => ({
  button: {
    variants: {
      size: {
        small: { padding: 4 },
        large: { padding: 16 },
      },
      color: {
        primary: { backgroundColor: theme.colors.primary },
        danger: { backgroundColor: theme.colors.danger },
      },
    },
    compoundVariants: [
      {
        size: 'large',
        color: 'danger',
        styles: { borderWidth: 3, borderColor: 'red' },
      },
    ],
  },
}))
```

### TypeScript inference with UnistylesVariants

```tsx
import type { UnistylesVariants } from 'react-native-unistyles'

const styles = StyleSheet.create(theme => ({
  chip: {
    variants: {
      size: { sm: { height: 24 }, md: { height: 32 }, lg: { height: 40 } },
      color: { primary: { backgroundColor: 'blue' }, secondary: { backgroundColor: 'gray' } },
    },
  },
}))

type ChipVariants = UnistylesVariants<typeof styles>
// { size?: 'sm' | 'md' | 'lg'; color?: 'primary' | 'secondary' }
// Options of a group are merged across all styles — no need to repeat empty variants

type ChipProps = { label: string } & ChipVariants

const Chip = ({ label, ...variants }: ChipProps) => {
  styles.useVariants(variants)
  return <View style={styles.chip}><Text>{label}</Text></View>
}
```

---

## Media Queries

Use `mq` for fine-grained width/height-based responsive values:

```tsx
import { mq, StyleSheet } from 'react-native-unistyles'

const styles = StyleSheet.create({
  container: {
    padding: {
      [mq.only.width(null, 575)]: 8,       // 0 <= width <= 575
      [mq.only.width(576, 767)]: 16,       // 576 <= width <= 767
      [mq.only.width(768)]: 24,            // width >= 768
    },
  },
  sidebar: {
    display: {
      [mq.only.width(null, 767)]: 'none',
      [mq.only.width(768)]: 'flex',
    },
  },
})
```

**Both bounds are inclusive** — `mq.only.width(576, 768)` and `mq.only.width(768)` overlap at exactly 768 (on native the first matching query wins). `mq` has priority over breakpoint keys in the same object. Breakpoint names are resolved when `mq` is called, so `StyleSheet.configure` must run first.

### Mixing breakpoint names and numeric values

```tsx
mq.only.width('sm', 'lg')       // sm <= width <= lg
mq.only.width(320, 768)         // 320 <= width <= 768 (same units as rt.screen)
mq.only.height(400)             // height >= 400
```

### Combined width + height

```tsx
const styles = StyleSheet.create({
  panel: {
    flexDirection: {
      [mq.width(null, 767).and.height(null, 499)]: 'column',   // small screen
      [mq.width(768).and.height(500)]: 'row',                  // large screen
    },
  },
})
```

---

## Style Merging

**NEVER spread styles.** Always use array syntax.

```tsx
// Combine multiple styles
<View style={[styles.container, styles.centered]} />

// Conditional styles
<View style={[styles.button, isActive && styles.active]} />

// Inline overrides
<View style={[styles.card, { marginTop: 20 }]} />

// Dynamic function + static
<View style={[styles.box(100), styles.shadow]} />
```

---

## Theme Management

### Setting up themes

```tsx
const lightTheme = {
  colors: {
    background: '#ffffff',
    text: '#000000',
    primary: '#007bff',
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
}

const darkTheme = {
  colors: {
    background: '#1a1a1a',
    text: '#ffffff',
    primary: '#4dabf7',
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
}

StyleSheet.configure({
  themes: { light: lightTheme, dark: darkTheme },
  settings: { initialTheme: 'light' },
})
```

### Adaptive themes (auto light/dark)

```tsx
StyleSheet.configure({
  themes: { light: lightTheme, dark: darkTheme },
  settings: { adaptiveThemes: true },  // auto-switches based on OS setting
})
```

Requires themes named exactly `light` and `dark`.

### Switching themes programmatically

```tsx
import { UnistylesRuntime } from 'react-native-unistyles'

// setTheme throws while adaptive themes are enabled — disable them first
if (UnistylesRuntime.hasAdaptiveThemes) {
  UnistylesRuntime.setAdaptiveThemes(false)
}

// Switch to specific theme
UnistylesRuntime.setTheme('dark')

// Toggle
const toggle = () => {
  UnistylesRuntime.setTheme(
    UnistylesRuntime.themeName === 'light' ? 'dark' : 'light'
  )
}
```

### Updating theme values at runtime

```tsx
UnistylesRuntime.updateTheme('light', current => ({
  ...current,
  colors: { ...current.colors, primary: '#ff6600' }
}))
```

### ScopedTheme for subtree overrides

```tsx
import { ScopedTheme } from 'react-native-unistyles'

// Force dark theme for a section
<ScopedTheme name="dark">
  <DarkCard />
  <DarkFooter />
</ScopedTheme>

// Invert: light→dark, dark→light (no-op unless adaptiveThemes is enabled)
<ScopedTheme invertedAdaptive>
  <InvertedSection />
</ScopedTheme>
```

---

## Responsive Components (Display / Hide)

```tsx
import { Display, Hide, mq } from 'react-native-unistyles'

const Layout = () => (
  <View style={styles.row}>
    {/* Only show on tablet+ */}
    <Display mq={mq.only.width(768)}>
      <Sidebar />
    </Display>

    <MainContent />

    {/* Hide mobile nav on tablet+ (width >= 768) */}
    <Hide mq={mq.only.width(768)}>
      <BottomNav />
    </Hide>
  </View>
)
```

---

## Web-Specific Features

### _web property

Add web-only styles using the `_web` key:

```tsx
const styles = StyleSheet.create(theme => ({
  button: {
    padding: 16,
    _web: {
      cursor: 'pointer',
      transition: 'background-color 0.2s ease',
      outline: 'none',
    },
  },
}))
```

`_web` can contain breakpoints and pseudo selectors but **not** `variants`; put a `_web` block inside a variant instead:

```tsx
const styles = StyleSheet.create({
  grid: {
    _web: { display: { xs: 'flex', md: 'grid' } },          // breakpoints OK
    variants: {
      size: {
        large: { _web: { gridTemplateColumns: 'repeat(3, 1fr)' } },  // _web inside a variant OK
      },
    },
  },
})
```

Inside `_web` use plain CSS values (e.g. `transform: 'translateX(10px)'`), not RN-specific syntax.

### Pseudo-classes and pseudo-elements

```tsx
const styles = StyleSheet.create(theme => ({
  button: {
    backgroundColor: theme.colors.primary,
    _web: {
      _hover: {
        backgroundColor: theme.colors.primaryHover,
      },
      _active: {
        backgroundColor: theme.colors.primaryActive,
        transform: 'scale(0.98)',  // CSS string inside _web
      },
      _focus: {
        outlineWidth: 2,
        outlineColor: theme.colors.focus,
      },
      _disabled: {
        opacity: 0.5,
        cursor: 'not-allowed',
      },
      '_focus-visible': {
        outlineStyle: 'dashed',
      },
      '_focus-within': {
        borderColor: theme.colors.focus,
      },
      _before: {
        content: '"*"',
      },
    },
  },
}))
```

Any standard (non-experimental) CSS pseudo-class / pseudo-element works, including functional ones like `_nth-child(2n)`: replace `:` / `::` with `_` and keep the CSS (kebab-case) name — `_hover`, `_active`, `'_focus-visible'`, `'_first-child'`, `_before`, `_after`, `_placeholder`, etc.

### Custom CSS class names

```tsx
const styles = StyleSheet.create({
  container: {
    _web: {
      _classNames: ['my-custom-class', 'another-class'],  // or a single string
    },
  },
})
```

### CSS variables

With `CSSVars: true` (the default), theme strings become CSS variables (`--colors-primary`) under `:root.<themeName>` (or `prefers-color-scheme` media queries with adaptive themes), so switching themes only swaps the `html` class. Set `CSSVars: false` if your themes differ in non-string values (numbers, functions).

### RTL / logical props on web

RN logical props map to CSS logical properties and follow the document `dir`: `start`/`end` → `inset-inline-*`, `marginStart`/`marginEnd` → `margin-inline-*`, `paddingStart`/`paddingEnd` → `padding-inline-*`, `borderStart*`/`borderEnd*` color & width → `border-inline-*`. Corner radii (`borderTopStartRadius`, ...) still map to physical corners.

### getWebProps for custom web components

```tsx
import { getWebProps } from 'react-native-unistyles/web'

const CustomWebComponent = () => {
  const webProps = getWebProps(styles.container)  // { className, ref }
  return <div {...webProps}>Content</div>
}
```

---

## Reanimated Integration

### useAnimatedTheme — access theme in worklets (no re-renders, respects ScopedTheme)

```tsx
import { useAnimatedTheme } from 'react-native-unistyles/reanimated'
import Animated, { useAnimatedStyle } from 'react-native-reanimated'

const MyComponent = () => {
  const animatedTheme = useAnimatedTheme()

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: animatedTheme.value.colors.background,
  }))

  // IMPORTANT: use array syntax to combine Unistyles + Reanimated styles
  return <Animated.View style={[styles.container, animatedStyle]} />
}
```

### useAnimatedVariantColor — animate color transitions

```tsx
import { useAnimatedVariantColor } from 'react-native-unistyles/reanimated'

const styles = StyleSheet.create(theme => ({
  button: {
    variants: {
      state: {
        active: { backgroundColor: theme.colors.primary },
        inactive: { backgroundColor: theme.colors.disabled },
      },
    },
  },
}))

const AnimatedButton = ({ isActive }) => {
  styles.useVariants({ state: isActive ? 'active' : 'inactive' })
  // SharedValue<string> holding the current variant color (also follows theme/breakpoint changes)
  const color = useAnimatedVariantColor(styles.button, 'backgroundColor')
  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: withTiming(color.value, { duration: 300 }),
  }))

  return <Animated.View style={[styles.button, animatedStyle]} />
}
```

### Combining Reanimated + Unistyles styles

Always use **array syntax**:

```tsx
<Animated.View style={[styles.container, animatedStyle]} />
```

Never spread:
```tsx
// WRONG: <Animated.View style={{ ...styles.container, ...animatedStyle }} />
```

---

## SSR with Next.js

### App Router

```tsx
// Style.tsx
'use client'

import { PropsWithChildren, useRef } from 'react'
import { useServerUnistyles } from 'react-native-unistyles/server'
import { useServerInsertedHTML } from 'next/navigation'
import './unistyles'

export const Style = ({ children }: PropsWithChildren) => {
  const isServerInserted = useRef(false)
  const unistyles = useServerUnistyles()  // also hydrates automatically on the client

  useServerInsertedHTML(() => {
    if (isServerInserted.current) {
      return null
    }

    isServerInserted.current = true

    return unistyles
  })

  return <>{children}</>
}

// app/layout.tsx
import '../unistyles'
import { Style } from '../Style'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Style>{children}</Style>
      </body>
    </html>
  )
}
```

### Pages Router

```tsx
// pages/_document.tsx
import { getServerUnistyles, resetServerUnistyles } from 'react-native-unistyles/server'

export default class Document extends NextDocument {
  static async getInitialProps({ renderPage }: DocumentContext) {
    const page = await renderPage()
    const styles = getServerUnistyles()

    resetServerUnistyles()  // required after every request

    return { ...page, styles }
  }
  // render() ...
}

// pages/_app.tsx
import { hydrateServerUnistyles } from 'react-native-unistyles/server'

useEffect(() => {
  hydrateServerUnistyles()
}, [])
```

Without adaptive themes, Unistyles adds the theme class to `<html>` — add `suppressHydrationWarning` (or the class itself) to avoid a hydration warning.

---

## Runtime Values in Styles

The mini runtime (`rt`) provides these values for use in `StyleSheet.create((theme, rt) => ...)`:

```tsx
const styles = StyleSheet.create((theme, rt) => ({
  container: {
    paddingTop: rt.insets.top,
    paddingBottom: rt.insets.bottom,
    paddingLeft: rt.insets.left,
    paddingRight: rt.insets.right,
  },
  content: {
    width: rt.screen.width - 32,
    maxHeight: rt.screen.height * 0.8,
  },
  statusBarSpacer: {
    height: rt.statusBar.height,
  },
  navBarSpacer: {
    height: rt.navigationBar.height,
  },
  responsive: {
    fontSize: rt.fontScale * 16,
    padding: rt.pixelRatio > 2 ? 16 : 12,
  },
  rtlAware: {
    textAlign: rt.rtl ? 'right' : 'left',  // rtl updates live on Android/web; iOS needs a restart
  },
}))
```

On web: `insets`, `statusBar` and `navigationBar` are `0`, `fontScale` is `1`, `pixelRatio` is `window.devicePixelRatio`.

### IME / Keyboard inset

`rt.insets.ime` provides the keyboard inset, replacing `react-native-reanimated`'s `useAnimatedKeyboard`:

```tsx
const styles = StyleSheet.create((theme, rt) => ({
  input: {
    marginBottom: rt.insets.ime,  // automatically adjusts when keyboard opens/closes
  },
}))
```

- **iOS**: full keyboard height, animated frame by frame
- **Android**: keyboard height minus the bottom inset; animated on Android 11+ (API 30), jumps on older versions
- **Web**: always `0`

Read `ime` in `StyleSheet` (zero re-renders). Reading it in `useUnistyles`/`withUnistyles` subscribes only to `Ime` but re-renders on every animation frame.
