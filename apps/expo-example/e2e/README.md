# E2E style verification

An in-app runner drives expo-example through navigation, theme changes, frozen screens, Suspense, scrolling and screen
actions. After every step it waits for the UI to settle and calls `verify()` from `react-native-unistyles/diagnostics`,
which rebuilds the style of every linked node (its own dynamic function arguments, variants and the current or scoped
theme) and compares it with the props committed to the shadow tree. A host script builds a Release app, starts the
runner through a deep link, pixel-checks themed probes at checkpoints and fails the run when the app crashes.

## Run

```sh
# from apps/expo-example
bun e2e/run.ts ios --device <simulator udid> --scenarios all --reps 3
bun e2e/run.ts android --device <adb serial> --scenarios frozen-stack,frozen-unmount --reps 10 --taps
```

- `--scenarios` comma separated ids from `protocol.ts` or `all` (default), `--reps` default 20, `--seed` default 1.
- `--taps` makes the host tap the header theme pills and back button (in `TAP_SCENARIOS`) instead of calling the same
  `selectTheme` / `router.back` from JS.
- `--skip-build` reuses the last Release build (`ios/build`, `android/app/build`).
- Artifacts (report JSON, checkpoint, failure and result screenshots, build log) land in the gitignored
  `e2e-results/<timestamp>/`. The script prints a summary and exits non-zero on any failure, stall or crash.

Prerequisites: a prebuilt `ios/` and `android/` (`bun run ios` / `bun run android` once, they are gitignored), the
babel plugin built (`bun run --cwd packages/unistyles plugin:build`), `argent` on PATH for iOS. Start the Android emulator
windowless from bash, a hidden window gets throttled by App Nap:

```sh
/bin/bash -c '~/Library/Android/sdk/emulator/emulator -avd Pixel_7_Pro_API_34 -no-window -gpu host -memory 4096 -no-snapshot-load -no-audio &'
```

Without the host, `expo-example:///e2e?scenarios=all&reps=1` runs everything (except the host only `os-appearance`,
`touchable-highlight` and `interactions`) and shows the result on screen, which also works in a Debug build with Metro.

## Scenarios

Every scenario starts on home, logged in, light theme, adaptive themes off and the original themes. The root stack
freezes every screen below the top one (`freezeOnBlur`), like `enableFreeze(true)`.

| id                    | drives                                                                     | aimed at                                                 |
| --------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------- |
| `tour`                | every showcase screen through every theme                                  | all features, home frozen during theme changes           |
| `shared-dynamic-fn`   | chip toggles after theme changes on `dynamic-functions`                    | #1192, stale `nativeProps` after a re-render (58316aa4)  |
| `frozen-stack`        | session steps 1 to 3 and back, theme change on step 3                      | #1262, frozen screens re-linked with another caller's args |
| `frozen-flip`         | theme changes while home and other screens are frozen                      | suspended nodes restored with the new theme              |
| `suspense`            | suspend and resume a Suspense boundary around theme changes                | #1260, per-view styles restored by Suspense (d5f8a851)   |
| `activity`            | theme changes and new arguments while `<Activity>` hides content           | hidden content that keeps rendering, shown again         |
| `frozen-list`         | a 300 row screen frozen and restored, with a theme change while frozen      | #1252, restoring a frozen screen blocked JS for seconds  |
| `animated-variant`    | `useAnimatedVariantColor` restored from a frozen stack after a theme change, `styles` read from the UI runtime | a reveal re-applying the color of the last render, #1213 |
| `frozen-unmount`      | log out with frozen steps, churn memory, log in, unfreeze, theme change    | #1217 / #1179, families unmounted while frozen (9afc15b6) |
| `scoped`              | theme changes, adaptive themes and a late mounted scope on `scoped-theme`  | scoped theme resolution                                  |
| `variants-after-flip` | variant changes after theme changes                                       | variants with fresh theme values                         |
| `mount-after-flip`    | screens pushed after theme changes, list scroll, screen actions            | nodes mounted into a changed theme                       |
| `set-theme-on-mount`  | a screen that calls `setTheme` from its mount effect                       | nodes rendered before a theme change that link after it  |
| `update-theme`        | `updateTheme` of the current theme, theme changes, restore                 | `UnistylesRuntime.updateTheme`                           |
| `runtime-hooks`       | follow the system while the theme already matches the OS                   | #1254, `useUnistyles` listeners skipped when no StyleSheet depends on a change |
| `transition`          | Unistyles commits while React yields in a `startTransition` render         | props React rendered before the commit (inline styles)   |
| `lists-scroll`        | theme changes at scrolled FlatList positions                               | virtualized rows mounted after a theme change            |
| `touchable-highlight` | TouchableHighlight pressed after theme changes and below a ScopedTheme (host only) | its underlay re-render commits the style React rendered last |
| `interactions`        | every component on `interactions` pressed, toggled or focused after theme changes (host only) | components re-rendering themselves below Unistyles, scoped and variant styles |
| `os-appearance`       | OS appearance flips with adaptive themes (host only)                       | adaptive themes, inverted adaptive scopes                |
| `random-walk`         | 14 seeded random theme changes, pushes, backs and screen actions           | combinations of the above                                |

## Checks

| check                 | when                   | catches                                                                                  |
| --------------------- | ---------------------- | ---------------------------------------------------------------------------------------- |
| `verify()` mismatch   | after every step       | a committed prop differs from the node's own style under the current (or scoped) theme   |
| `pendingUpdates`      | after every step       | shadow tree updates that were queued but never committed                                 |
| `orphans`             | `frozen-unmount`       | families unmounted while frozen that survive the sweep of a theme change                 |
| `expect`              | after a screen check   | a prop React owns differs in the committed tree, eg. `transition.check` measures the bar, `animations.variant-color` reads the Reanimated color, or the JS thread stalled too long (`frozen-list.stall`) |
| probe                 | at checkpoints         | the screen paints other colors than the theme (overlay squares, Reanimated, RN Animated) |
| crash                 | while the host waits   | the app process died, e.g. a use after free on a frozen unmount                          |
| host `timeout`, stall | at sync points         | the screen stopped updating or the runner hung                                           |

`verify()` compares `backgroundColor`, border colors, `opacity`, `shadowColor`, text `color`, `fontSize`, `fontWeight`,
text decoration and background colors and Image `tintColor` (`cxx/shadowTree/ShadowTreeDiagnostics.cpp`). Props set
last by an inline style (or a Reanimated animated style) belong to React and are skipped. Suspended (frozen or hidden by
Suspense) nodes are counted, not compared, they get fresh styles when restored.

## How it works

- `runner.ts` runs each step as act, `settle()`, `verify()`, record. `expect` steps run a check registered with
  `useE2EAction` that returns a failure or nothing, for props `verify()` skips because React owns them. Theme changes go through the header's
  `selectTheme`, screen actions through `useE2EAction` handlers (the same code the screen's buttons run) and scrolling
  through `e2eScrollRef`. Presses are real touches: the runner asks the host to tap the element with a testID and waits
  until its press handler counted the press (`presses.ts`). The counter is not React state, a press must not re-render
  the screen, as a re-render re-links every wrapper and hides what a component rendered below Unistyles on its own.
  `settle.ts` waits two idle callbacks and two frames: Unistyles applies theme changes from a
  native callback on the JS thread, the idle callbacks run after it.
- The overlay (`E2EOverlay.tsx`, rendered by the root layout outside the navigator, so it never freezes) renders nothing
  until the e2e route starts a run. Then it shows a beacon, six themed probes and the current marker
  (`E2E CHECKPOINT <n> <theme> #<seq>`, `E2E TAP <testID> #<seq>`, `E2E RESULT PASS|FAIL #<seq>`).
- At a sync point the runner blocks and the beacon turns magenta or yellow (by sync parity). The host polls screenshots
  until the beacon shows the next sync, only then reads the accessibility tree, and answers by tapping the beacon or the
  requested element, or flips the OS appearance (`xcrun simctl ui`, `adb shell cmd uimode night`) for `APPEARANCE`
  syncs. Between polls it checks that the app process is alive.
- The final report travels as URI encoded JSON in the `E2E REPORT` accessibility label, the only channel both platforms
  expose in Release without new dependencies.
- The protocol and probe colors (`protocol.ts`) import the themes from `themes.ts`, the same objects `unistyles.ts`
  registers.

## Mutation check

Each fix was reverted (or its mechanism disabled) in a Release build and the suite failed with a report pointing at
the cause (2026-10-02, iOS 27 simulator, iPhone Air; M6 to M8 rechecked and M9 to M11 added 2026-10-03 on iOS and Android, M12 and M13 added 2026-10-05, M14 added 2026-10-06):

| mutation                                                                                   | caught by                                                         | first failure                                                                                   |
| ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| M1 revert 58316aa4 (#1192), `link` no longer commits outdated `nativeProps`                 | `shared-dynamic-fn`, `frozen-flip`, `mount-after-flip`, `random-walk` | header `View 'pill' backgroundColor expected <dark subtle> actual <light fill>` after `flip dark` |
| M2 revert d5f8a851 + a8d51464 (#1260 / #1262), seed `parsedStyle` from the shared unistyle | every scenario, 24 probe failures                                 | overlay `View 'probe' backgroundColor expected <primary> actual <accent>` (last caller wins)    |
| M3 revert a8d51464 only, `rebuildUnistyle` in `link` clears the StyleSheet's dirty flag      | `frozen-stack` (fresh step pushed after frozen steps re-linked)   | `Paragraph 'description' color expected <dark muted> actual <light muted>`                      |
| M4a #1266: no sweep of families unmounted while frozen                                      | `frozen-unmount`                                                  | `orphans expected 0 actual 6` (12 after the second rep)                                         |
| M4b #1266: queued updates are never drained (the #1217 leak)                                | every step                                                        | `pendingUpdates expected 0 actual 57`                                                           |
| M5 ActivityIndicator linked like a View, its style goes to the inner spinner                | `tour`, `mount-after-flip` (iOS and Android)                      | `ActivityIndicatorView 'spinner' backgroundColor expected <light subtle> actual undefined`      |
| M6 no `refreshReactNodes`, React re-attaches a subtree from before a Unistyles commit       | `update-theme` after `set-theme-on-mount` (iOS and Android)       | runtime `View 'accent' backgroundColor expected <shuffled accent> actual <previous accent>`     |
| M7 shadow tree updates keep the props an inline style sets last (cached in `nativeProps`)    | `transition` (iOS and Android, 12 failures in 3 reps)             | transition `bar width expected 120 actual 200` after a commit while React yields               |
| M8 `refreshReactNodes` also re-points React's uncommitted clones (no `getHasBeenPromoted`)   | `transition` (iOS and Android, 6 failures in 3 reps)              | transition `bar width expected 120 actual 200`, the clone React made before the commit is lost |
| M9 `link` commits once per restored node of a frozen screen (#1252)                          | `frozen-list` (iOS and Android)                                   | `js stall ms expected <= 300 actual 870` (iOS) and `actual 1519` (Android) on the first restore |
| M10 `useAnimatedVariantColor` re-applies the color of its last render when a frozen screen is revealed | `animated-variant` (iOS and Android, 3 failures in 3 reps) | `animated backgroundColor expected #ff9ff3 actual rgba(255, 107, 107, 1)`, the light accent after a flip to dark |
| M11 `add` links only the first unistyle of an object RN Animated flattened from an array     | `shared-dynamic-fn`, `mount-after-flip`, `set-theme-on-mount` (iOS and Android) | overlay probe `native-animated` expected `#ffffff` (dark) actual `#1b1b1f` (light), 0 mismatches |
| M12 TouchableHighlight linked like a View, its underlay re-render commits the style React rendered last | `touchable-highlight`, `interactions` (both reverted: 153 failures on iOS and Android, M12 alone 147 on iOS) | `View 'highlight' backgroundColor expected <premium secondary> actual <light secondary>` after a press |
| M13 a scoped `link` of a mounted node queues its update without committing it               | `touchable-highlight`, `interactions` (iOS, 12 failures)          | scoped `View 'highlight' backgroundColor expected <dark secondary> actual <light secondary>`, `pendingUpdates expected 0 actual 1` |
| M14 no worklet runtime guard in `HostUnistyle::get` (#1213), a worklet reads RN runtime values | `animated-variant` (iOS and Android, Android 3 of 3 runs crash)    | iOS `worklet access expected Unistyles worklet error actual no error, width undefined`, Android SIGSEGV on `mqt_v_js` |

#1266 can't be reverted as a whole, `verify()` reads the registry it introduced, so M4a and M4b disable its two
mechanisms. The use after free itself (#1217, #1179) only crashes with freed families, which needs a Release build with
a sanitizer, the host still reports a crash whenever one happens.

## Known issues found by the suite

The issues it found are fixed and covered by M5 (ActivityIndicator), M6 (`updateTheme`), M12 (TouchableHighlight) and
M13 (scoped Pressable). Open, not covered:

- A component below a `ScopedTheme` that re-renders on its own (local state, or the child TouchableHighlight clones on a
  press) links with the scope the last `ApplyScopedTheme` left behind, usually the global theme. `verify()` can't see it,
  it compares against the scope recorded at link time. Repro: `interactions`, press `Counter` in the scoped section,
  it turns into the global theme.

## Known limitations

- Android reads the tree with `uiautomator`, which needs an idle UI, so sync points never happen while an infinite
  animation is on screen (spinners render with `animating={false}`).
- A theme change is asynchronous (`runOnJSThread`), `settle()` relies on the idle callbacks running after it.
