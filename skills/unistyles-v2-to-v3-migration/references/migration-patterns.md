# Migration Patterns: v2 to v3 Before/After

## 1. Configuration: UnistylesRegistry -> StyleSheet.configure

### v2
```tsx
import { UnistylesRegistry } from 'react-native-unistyles'

UnistylesRegistry
  .addThemes({
    light: lightTheme,
    dark: darkTheme,
    premium: premiumTheme
  })
  .addBreakpoints({
    xs: 0,
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200
  })
  .addConfig({
    adaptiveThemes: true,
    initialTheme: 'light',
    plugins: [autoGuidelinePlugin],
    experimentalCSSMediaQueries: true,
    windowResizeDebounceTimeMs: 100,
    disableAnimatedInsets: true
  })
```

### v3
```tsx
import { StyleSheet } from 'react-native-unistyles'

StyleSheet.configure({
  themes: {
    light: lightTheme,
    dark: darkTheme,
    premium: premiumTheme
  },
  breakpoints: {
    xs: 0,
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200
  },
  settings: {
    adaptiveThemes: true
    // initialTheme: 'light' - only when adaptiveThemes is NOT true (v3 throws if both are set)
  }
})
```

In v3, `initialTheme` with `adaptiveThemes: true` throws, so don't copy both over from a v2 config. Pick one: keep `adaptiveThemes: true` (requires `light` and `dark` themes), or drop it and keep `initialTheme`.

**Removed settings:**
- `plugins` - plugin system removed entirely
- `experimentalCSSMediaQueries` - now enabled by default on web
- `windowResizeDebounceTimeMs` - no debouncing in v3
- `disableAnimatedInsets` - insets no longer trigger re-renders

Leaving any removed (or otherwise unknown) key in `settings` throws: `settings` accepts only `adaptiveThemes`, `initialTheme`, `CSSVars` and `nativeBreakpointsMode`.

**New settings:**
- `CSSVars` (boolean, default true) - enable/disable CSS variables on web
- `nativeBreakpointsMode` ('pixels' | 'points', default 'pixels') - on iOS/Android, `'pixels'` compares breakpoints/`mq` against `UnistylesRuntime.screen` (pt/dp); `'points'` divides it by `pixelRatio` first

The first breakpoint must be `0`, and `StyleSheet.configure` must run before any `StyleSheet.create` is evaluated.

---

## 2. StyleSheet Creation: createStyleSheet -> StyleSheet.create

### Static styles (no theme)

```diff
- import { createStyleSheet } from 'react-native-unistyles'
- const stylesheet = createStyleSheet({
+ import { StyleSheet } from 'react-native-unistyles'
+ const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 16
    }
  })
```

### With theme

```diff
- const stylesheet = createStyleSheet(theme => ({
+ const styles = StyleSheet.create(theme => ({
    container: {
      backgroundColor: theme.colors.background,
      padding: theme.spacing.md
    }
  }))
```

### With theme and miniRuntime

```diff
- const stylesheet = createStyleSheet((theme, rt) => ({
+ const styles = StyleSheet.create((theme, rt) => ({
    container: {
      backgroundColor: theme.colors.background,
      paddingTop: rt.insets.top,
      paddingBottom: rt.insets.bottom
    }
  }))
```

The `rt` (miniRuntime) parameter provides: `colorScheme`, `contentSizeCategory`, `themeName`, `breakpoint`, `hasAdaptiveThemes`, `insets` (top, left, right, bottom, ime), `pixelRatio`, `fontScale`, `rtl`, `isLandscape`, `isPortrait`, `screen`, `statusBar`, `navigationBar` (dimensions only, always `0` on iOS/web). Type helpers that receive it with `import type { UnistylesMiniRuntime } from 'react-native-unistyles'`.

---

## 3. Using Styles: useStyles removal

### Basic usage

```diff
- import { useStyles } from 'react-native-unistyles'
-
  const MyComponent = () => {
-   const { styles } = useStyles(stylesheet)
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Hello</Text>
      </View>
    )
  }
```

In v3, `styles` from `StyleSheet.create` are used directly. The Babel plugin adds reactivity at build time.

### Getting theme from useStyles

```diff
- import { useStyles } from 'react-native-unistyles'
+ import { useUnistyles } from 'react-native-unistyles'

  const MyComponent = () => {
-   const { theme } = useStyles()
+   const { theme } = useUnistyles()
    return <Text style={{ color: theme.colors.primary }}>Hello</Text>
  }
```

### Getting breakpoint from useStyles

```diff
- const { breakpoint } = useStyles()
+ const { rt } = useUnistyles()
+ const breakpoint = rt.breakpoint
```

Or better yet, use `Display`/`Hide` components or breakpoint values in StyleSheet.

---

## 4. Variants

### v2: Variants passed via useStyles second argument

```tsx
// v2
const stylesheet = createStyleSheet(theme => ({
  container: {
    variants: {
      size: {
        small: { padding: 8 },
        large: { padding: 24 },
        default: { padding: 16 }
      },
      color: {
        primary: { backgroundColor: theme.colors.primary },
        secondary: { backgroundColor: theme.colors.secondary }
      }
    }
  }
}))

const MyComponent = ({ size, color }) => {
  const { styles } = useStyles(stylesheet, { size, color })
  return <View style={styles.container} />
}
```

### v3: Variants via styles.useVariants()

```tsx
// v3
const styles = StyleSheet.create(theme => ({
  container: {
    variants: {
      size: {
        small: { padding: 8 },
        large: { padding: 24 },
        default: { padding: 16 }
      },
      color: {
        primary: { backgroundColor: theme.colors.primary },
        secondary: { backgroundColor: theme.colors.secondary }
      }
    }
  }
}))

const MyComponent = ({ size, color }) => {
  styles.useVariants({ size, color })  // call before accessing styles
  return <View style={styles.container} />
}
```

If v2 code called `useStyles(stylesheet)` without variants but the stylesheet relies on `default` variants, call `styles.useVariants({})` — v3 ignores variants entirely when `useVariants` isn't called, and `useVariants(undefined)` throws on iOS/Android.

### Boolean variants

```tsx
const styles = StyleSheet.create({
  button: {
    variants: {
      disabled: {
        true: { opacity: 0.5 },
        false: { opacity: 1 },
        default: { opacity: 1 }
      }
    }
  }
})

// Usage
styles.useVariants({ disabled: isDisabled })
```

### Compound variants (v3 only - new feature)

```tsx
const styles = StyleSheet.create(theme => ({
  button: {
    variants: {
      size: {
        small: { padding: 4 },
        large: { padding: 16 }
      },
      color: {
        primary: { backgroundColor: theme.colors.primary },
        danger: { backgroundColor: theme.colors.danger }
      }
    },
    compoundVariants: [
      {
        size: 'small',
        color: 'danger',
        styles: {
          borderWidth: 2,
          borderColor: theme.colors.dangerBorder
        }
      }
    ]
  }
}))
```

### TypeScript variant inference

```diff
- import type { UnistylesVariants } from 'react-native-unistyles'
- type MyVariants = UnistylesVariants<typeof stylesheet>

+ import type { UnistylesVariants } from 'react-native-unistyles'
+ type MyVariants = UnistylesVariants<typeof styles>
```

---

## 5. Dynamic Functions (style functions with arguments)

### v2

```tsx
const stylesheet = createStyleSheet(theme => ({
  box: (width: number, isActive: boolean) => ({
    width,
    backgroundColor: isActive ? theme.colors.active : theme.colors.inactive
  })
}))

const MyComponent = ({ width, isActive }) => {
  const { styles } = useStyles(stylesheet)
  return <View style={styles.box(width, isActive)} />
}
```

### v3

```tsx
const styles = StyleSheet.create(theme => ({
  box: (width: number, isActive: boolean) => ({
    width,
    backgroundColor: isActive ? theme.colors.active : theme.colors.inactive
  })
}))

const MyComponent = ({ width, isActive }) => {
  return <View style={styles.box(width, isActive)} />
}
```

Dynamic functions work the same way but without the `useStyles` wrapper. Arguments must be serializable: strings, numbers, booleans, `null`, `undefined` and plain arrays/objects built from them. Unistyles stores them in C++ and may re-run the function with the stored copy (theme/runtime changes, re-linking frozen screens), so functions are dropped (top-level ones shift the remaining arguments) and `Date` / `Map` / `Set` / class instances become plain objects. Pass precomputed values (e.g. `date.getTime()`) instead.

---

## 6. useInitialTheme -> settings.initialTheme

### v2

```tsx
import { useInitialTheme } from 'react-native-unistyles'

const App = () => {
  const userTheme = storage.getString('preferredTheme') ?? 'light'
  useInitialTheme(userTheme)

  return <Navigator />
}
```

### v3

```tsx
import { StyleSheet } from 'react-native-unistyles'

StyleSheet.configure({
  themes: { light: lightTheme, dark: darkTheme },
  settings: {
    initialTheme: () => {
      return storage.getString('preferredTheme') ?? 'light'
    }
  }
})
```

`initialTheme` accepts a `keyof UnistylesThemes` string or a synchronous function returning one.

---

## 7. Style Merging: Spread -> Array Syntax

### Merging multiple Unistyles styles

```diff
- <View style={{ ...styles.container, ...styles.centered }} />
+ <View style={[styles.container, styles.centered]} />
```

### Merging Unistyles with inline styles

```diff
- <View style={{ ...styles.container, marginTop: 10 }} />
+ <View style={[styles.container, { marginTop: 10 }]} />
```

### Merging with conditional styles

```diff
- <View style={{ ...styles.base, ...(isActive && styles.active) }} />
+ <View style={[styles.base, isActive && styles.active]} />
```

### Merging with dynamic values

```diff
- <View style={{ ...styles.box, width: computedWidth }} />
+ <View style={[styles.box, { width: computedWidth }]} />
```

---

## 8. UnistylesRuntime Changes

### Theme management (mostly same)

```tsx
// Same in v2 and v3:
UnistylesRuntime.themeName        // current theme name
UnistylesRuntime.setTheme('dark') // change theme
UnistylesRuntime.updateTheme('dark', current => ({
  ...current,
  colors: { ...current.colors, primary: 'blue' }
}))
UnistylesRuntime.getTheme()       // get current theme object
UnistylesRuntime.getTheme('light') // get specific theme
```

### Adaptive themes (same)

```tsx
UnistylesRuntime.setAdaptiveThemes(true)
UnistylesRuntime.hasAdaptiveThemes
UnistylesRuntime.colorScheme // 'light' | 'dark' | 'unspecified'
```

### hairlineWidth relocation

```diff
- UnistylesRuntime.hairlineWidth
+ StyleSheet.hairlineWidth
```

### setRootViewBackgroundColor (alpha removed), we can pass now any color supported by React Native

```diff
- UnistylesRuntime.setRootViewBackgroundColor(color, 0.5) // with alpha
+ UnistylesRuntime.setRootViewBackgroundColor(color)     // any RN color, e.g. 'rgba(0, 0, 0, 0.5)'
+ UnistylesRuntime.setRootViewBackgroundColor()          // reset to transparent
```

### Status bar (v3)

```diff
- UnistylesRuntime.statusBar.setColor(theme.colors.primary)
- UnistylesRuntime.statusBar.setColor(theme.colors.primary, 0.5)
+ // setColor removed in v3 (Android 15 deprecation)
+ import { StatusBarStyle } from 'react-native-unistyles'
+
+ UnistylesRuntime.statusBar.setHidden(true, 'fade')            // animation: 'none' | 'fade' | 'slide' (iOS)
+ UnistylesRuntime.statusBar.setStyle(StatusBarStyle.Light)     // StatusBarStyle.Default | Light | Dark, optional 2nd arg `animated`
+ UnistylesRuntime.statusBar.width                              // read-only
+ UnistylesRuntime.statusBar.height                             // read-only
```

### Navigation bar (v3, Android only)

```diff
- UnistylesRuntime.navigationBar.setColor(theme.colors.black)
+ // setColor removed in v3 (Android 15 deprecation)
+ UnistylesRuntime.navigationBar.setHidden(true)
+ UnistylesRuntime.navigationBar.width               // read-only, 0 on iOS
+ UnistylesRuntime.navigationBar.height              // read-only, 0 on iOS
```

### Immersive mode (v3)

```tsx
// Android: hides status bar and navigation bar
// iOS: hides only the status bar (with 'fade' animation)
UnistylesRuntime.setImmersiveMode(true)
```

System bars are only reachable through `UnistylesRuntime.statusBar` / `UnistylesRuntime.navigationBar` — don't import standalone status/navigation bar objects from `react-native-unistyles`.

### Removed properties

```diff
- UnistylesRuntime.addPlugin(myPlugin)
- UnistylesRuntime.removePlugin(myPlugin)
- UnistylesRuntime.enabledPlugins
```

---

## 9. UnistylesProvider Removal

```diff
- import { UnistylesProvider } from 'react-native-unistyles'
-
- const App = () => (
-   <UnistylesProvider>
-     <Navigator />
-   </UnistylesProvider>
- )

+ const App = () => (
+   <Navigator />
+ )
```

No provider needed in v3.

---

## 10. Keyboard / IME Insets

### v2 (workaround with animated keyboard)

```tsx
import { useAnimatedKeyboard } from 'react-native-reanimated'

const keyboard = useAnimatedKeyboard()
// Use keyboard.height in animated styles
```

### v3 (built-in ime inset)

```tsx
const styles = StyleSheet.create((theme, rt) => ({
  input: {
    paddingBottom: rt.insets.ime
  }
}))
```

The `ime` (Input Method Editor) inset automatically animates with keyboard show/hide. No need for `react-native-reanimated` keyboard handling. Platform differences: iOS reports the full keyboard height; Android reports keyboard height minus the bottom inset (animated on API 30+); web is always `0`. Read it in `StyleSheet` — reading `rt.insets.ime` in `useUnistyles` / `withUnistyles` re-renders on every animation frame.

---

## 11. Responsive Display/Hide Components (v3 only)

### v2 (manual breakpoint checks)

```tsx
const { breakpoint } = useStyles()

return (
  <>
    {breakpoint === 'sm' && <MobileNav />}
    {breakpoint !== 'sm' && <DesktopNav />}
  </>
)
```

### v3

```tsx
import { Display, Hide, mq } from 'react-native-unistyles'

return (
  <>
    <Hide mq={mq.only.width('md')}>
      <MobileNav />
    </Hide>
    <Display mq={mq.only.width('md')}>
      <DesktopNav />
    </Display>
  </>
)
```

---

## 12. withUnistyles for Third-Party Components

### v2 (theme in component via useStyles)

```tsx
const MyScreen = () => {
  const { theme } = useStyles()
  return <ThirdPartyButton color={theme.colors.primary} />
}
```

### v3

```tsx
import { withUnistyles } from 'react-native-unistyles'

const UniThirdPartyButton = withUnistyles(ThirdPartyButton, (theme, rt) => ({
  color: theme.colors.primary,
  size: rt.screen.width > 768 ? 'large' : 'small'
}))

// Usage - no hook needed:
const MyScreen = () => <UniThirdPartyButton />
```

### withUnistyles with uniProps (dynamic at call site)

```tsx
const UniButton = withUnistyles(Button)

// Override mappings per instance:
<UniButton
  uniProps={(theme) => ({ color: theme.colors.secondary })}
/>
```

### withUnistyles with style prop

```tsx
// Unistyles styles can be passed to withUnistyles-wrapped components:
const UniView = withUnistyles(View)

<UniView style={styles.container} />
<UniView style={[styles.container, styles.centered]} />
```

---

## 13. ScopedTheme Component (v3 only)

```tsx
import { ScopedTheme } from 'react-native-unistyles'

// Force a subtree to use a specific theme
<ScopedTheme name="dark">
  <Card />  {/* Will use dark theme regardless of global theme */}
</ScopedTheme>

// Invert adaptive theme
<ScopedTheme invertedAdaptive>
  <Card />  {/* Light when global is dark, dark when global is light */}
</ScopedTheme>

// Reset to global theme (undoes parent ScopedTheme)
<ScopedTheme reset>
  <Card />  {/* Back to global theme */}
</ScopedTheme>
```

---

## 14. Web Features

### Pseudo-classes (v2 -> v3)

```tsx
// Both v2 and v3 use _web with pseudo-classes, but v3 syntax is cleaner:
const styles = StyleSheet.create(theme => ({
  button: {
    backgroundColor: theme.colors.primary,
    _web: {
      cursor: 'pointer',
      _hover: {
        backgroundColor: theme.colors.primaryHover
      },
      _active: {
        backgroundColor: theme.colors.primaryActive
      },
      _focus: {
        outline: `2px solid ${theme.colors.focus}`
      }
    }
  }
}))
```

Move any usage of $$css for React Native web to StyleSheet -> _web. Unistyles supports $$css under the hood.

### getWebProps (v3 - for custom HTML elements)

```tsx
import { getWebProps } from 'react-native-unistyles/web'

const MyWebComponent = forwardRef((props, ref) => {
  const { className, ref: unistylesRef } = getWebProps(styles.container, ref)
  return <div className={className} ref={unistylesRef} />
})
```

---

## 15. Reanimated Integration

### v3 imports from separate entry point

```tsx
import { useAnimatedTheme } from 'react-native-unistyles/reanimated'
import { useAnimatedVariantColor } from 'react-native-unistyles/reanimated'
```

### useAnimatedTheme

```tsx
const animatedTheme = useAnimatedTheme()

const animatedStyle = useAnimatedStyle(() => ({
  backgroundColor: animatedTheme.value.colors.background
}))

// IMPORTANT: Keep Unistyles and Reanimated styles in separate array elements
<Animated.View style={[styles.container, animatedStyle]} />
```

### useAnimatedVariantColor

```tsx
const animatedColor = useAnimatedVariantColor(styles.button, 'backgroundColor')

const animatedStyle = useAnimatedStyle(() => ({
  backgroundColor: animatedColor.value
}))
```

---

## 16. TypeScript Declaration Changes

### v2

```tsx
import type { UnistylesThemes, UnistylesBreakpoints } from 'react-native-unistyles'

type AppThemes = {
  light: typeof lightTheme
  dark: typeof darkTheme
}

declare module 'react-native-unistyles' {
  export interface UnistylesThemes extends AppThemes {}
  export interface UnistylesBreakpoints {
    xs: number
    sm: number
    md: number
  }
}
```

### v3 (same pattern, derive types from the objects passed to `StyleSheet.configure`)

```tsx
type AppThemes = typeof themes          // { light: lightTheme, dark: darkTheme }
type AppBreakpoints = typeof breakpoints

declare module 'react-native-unistyles' {
  export interface UnistylesThemes extends AppThemes {}
  export interface UnistylesBreakpoints extends AppBreakpoints {}
}
```

Note: `interface X extends typeof y {}` is not valid TypeScript — always go through a type alias.

---

## 17. Testing / Mocks Setup

### v2

```tsx
// jest.setup.js - manual mocking
jest.mock('react-native-unistyles', () => ({
  createStyleSheet: (styles) => styles,
  useStyles: () => ({ styles: {}, theme: {} }),
  UnistylesRuntime: { /* mock values */ }
}))
```

### v3

Remove the manual `jest.mock('react-native-unistyles', ...)` and use the built-in mocks in `setupFiles`:

```json
// package.json
{
  "jest": {
    "setupFiles": [
      "react-native-unistyles/mocks",
      "./unistyles.ts"
    ]
  }
}
```

The config file (with `StyleSheet.configure()`) must come after the mocks. The Babel plugin is a no-op when `NODE_ENV=test`. The built-in mock at `react-native-unistyles/mocks` covers `react-native-nitro-modules`, `StyleSheet`, `UnistylesRuntime`, `withUnistyles`, `useUnistyles`, `mq`, `Display`, `Hide`, `ScopedTheme`, the exported enums, and `react-native-unistyles/reanimated`.

Mock limitations: styles always use the first registered theme (`initialTheme` / `adaptiveThemes` ignored), runtime dimensions/insets are `0`, `variants` / `compoundVariants` are stripped and `useVariants` is a no-op, `Display` / `Hide` / `ScopedTheme` render nothing, and `createUnistylesElement`, `UnistyleDependency` and the SSR helpers are `undefined`.
