---
name: react-native-unistyles-v3
description: >
  Guide for using react-native-unistyles v3. Triggers on: "unistyles", "StyleSheet.create",
  "create stylesheet", "add theme", "breakpoints", "variants", "withUnistyles", "useUnistyles",
  "ScopedTheme", "UnistylesRuntime", "style component", "responsive styles", "media queries",
  "dynamic styles", "scoped theme", "adaptive theme", "unistyles setup", "unistyles config".
  Covers setup, theming, responsive design, variants, web features, third-party integration,
  and troubleshooting.
disable-model-invocation: false
user-invocable: true
allowed-tools: Read, Grep, Glob, Edit, Write, Bash(npx *)
---

# React Native Unistyles v3 Skill

You are assisting with React Native Unistyles v3 styling. v3 is a zero-re-render styling library with a C++ core (Nitro Modules) and Babel plugin that processes StyleSheets at build time. It replaces React Native's `StyleSheet` with a reactive, theme-aware, responsive system.

## Prerequisites

- React Native 0.78+ with **New Architecture mandatory** (default from RN 0.83+)
- React 19+ (enforced at runtime)
- `react-native-nitro-modules` (native bridge dependency)
- `react-native-edge-to-edge` (required for Android edge-to-edge insets)
- Expo SDK 53+ (if using Expo; **not compatible with Expo Go** — requires dev client or prebuild)
- Xcode 16+ (iOS)

## Workflow

1. **Read user's code first** — understand current setup, imports, and styling approach
2. **Identify intent** — new setup, add theming, responsive design, fix an issue, etc.
3. **Apply v3 patterns** — use the correct API from this skill; consult reference files for details
4. **Verify correctness** — check for critical rule violations (spreading, barrel re-exports, etc.)

## Quick Reference

### StyleSheet.create — 3 overloads

```tsx
import { StyleSheet } from 'react-native-unistyles'

// 1. Static object compatible with React Native StyleSheet.create
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 }
})

// 2. Theme function (reactive to theme changes, zero re-renders)
const styles = StyleSheet.create(theme => ({
  container: { backgroundColor: theme.colors.background }
}))

// 3. Theme + miniRuntime function (reactive to theme AND device state)
const styles = StyleSheet.create((theme, rt) => ({
  container: {
    backgroundColor: theme.colors.background,
    paddingTop: rt.insets.top,
    width: rt.screen.width > 768 ? 500 : rt.screen.width - 32
  }
}))
```

### StyleSheet.configure — one-time setup

```tsx
StyleSheet.configure({
  themes: { light: lightTheme, dark: darkTheme },
  breakpoints: { xs: 0, sm: 576, md: 768, lg: 992, xl: 1200 },
  settings: {
    initialTheme: 'light',       // or: () => storage.getString('theme') ?? 'light'
    // adaptiveThemes: true,     // auto-switch light/dark based on OS (mutually exclusive with initialTheme)
    // CSSVars: true,            // use CSS custom properties on web
    // nativeBreakpointsMode: 'pixels' | 'points'
  }
})
```

### Variants

```tsx
const styles = StyleSheet.create(theme => ({
  button: {
    variants: {
      size: {
        small: { padding: 4 },
        medium: { padding: 8 },
        large: { padding: 16 },
      },
      color: {
        primary: { backgroundColor: theme.colors.primary },
        secondary: { backgroundColor: theme.colors.secondary },
      }
    },
    compoundVariants: [
      { size: 'large', color: 'primary', styles: { borderWidth: 2 } }
    ],
  }
}))

// In component — call useVariants BEFORE accessing styles
styles.useVariants({ size: 'large', color: 'primary' })
return <View style={styles.button} />
```

### withUnistyles — wrap third-party components (not React Native or Reanimated components)

```tsx
import { withUnistyles } from 'react-native-unistyles'
import { Button } from 'some-library'

const UniButton = withUnistyles(Button, (theme, rt) => ({
  color: theme.colors.primary,
  size: rt.screen.width > 400 ? 'large' : 'small'
}))

// Usage: <UniButton title="Press me" />
```

## Critical Rules

1. **NEVER spread styles** — `{...styles.x}` breaks C++ proxy binding. ALWAYS use array syntax: `[styles.x, styles.y]` or `[styles.x, { marginTop: 10 }]`
2. **NEVER re-export StyleSheet from barrel files** — the Babel plugin detects `StyleSheet.create` by import source. Re-exporting breaks detection.
3. **Babel plugin is REQUIRED** — add `['react-native-unistyles/plugin', { root: 'src' }]` to babel.config.js. Without it, styles won't be reactive.
4. **Import StyleSheet from `react-native-unistyles` only** — it polyfills all RN StyleSheet APIs (`hairlineWidth`, `compose`, `flatten`, `absoluteFill`). Replace all `import { StyleSheet } from 'react-native'`.
5. **`styles.useVariants()` must be called before accessing variant-dependent styles** — treat it like a React hook (top of component).
6. **Prefer `StyleSheet.create(theme => ...)` over `useUnistyles()`** — theme functions cause zero re-renders; `useUnistyles()` re-renders on every theme/runtime change.
7. **`StyleSheet.configure()` must be called before any `StyleSheet.create()`** — typically in your app entry point, before any component renders.

## Decision Trees

### Choosing a styling approach

```
Need theme/runtime in styles?
├─ YES → StyleSheet.create((theme, rt) => ...)     [zero re-renders]
└─ NO  → StyleSheet.create({ ... })                [static styles]

Need theme values as non-style props?
├─ YES → withUnistyles(Component, (theme, rt) => ({ propName: theme.value }))
└─ NO  → Pass Unistyles styles via style prop directly

Need theme/runtime in component logic (not just styles)?
├─ YES → useUnistyles() hook                        [causes re-renders]
└─ NO  → Use StyleSheet.create with theme function
```

### Third-party component integration

```
Does the component accept a `style` prop?
├─ YES → Pass Unistyles styles directly (Babel auto-processes standard RN views)
│        If it's a custom native view → add to autoProcessPaths in Babel config
├─ NO  → Does it accept theme-derived props (color, size, etc.)?
│        ├─ YES → withUnistyles(Component, (theme, rt) => ({ prop: theme.value }))
│        └─ NO  → useUnistyles() as fallback
└─ Component from node_modules not processed?
   → Add its path to autoProcessPaths or autoProcessImports in Babel plugin config
```

## Reference Files

- **Setup, installation, Babel plugin, TypeScript, testing, Expo Router**: read [references/setup-guide.md](references/setup-guide.md)
- **Complete API for every export**: read [references/api-reference.md](references/api-reference.md)
- **Code patterns: themes, variants, breakpoints, web, SSR, Reanimated**: read [references/styling-patterns.md](references/styling-patterns.md)
- **withUnistyles, autoProcessPaths, React Compiler, Reanimated, FlatList**: read [references/third-party-integration.md](references/third-party-integration.md)
- **Troubleshooting from 150+ GitHub issues with solutions**: read [references/common-issues.md](references/common-issues.md)
