// Showcase screens listed on home, every one is a route in app/
export const screens = [
    { route: 'basics', title: 'Basics', description: 'Theme styles, arrays, every wrapped React Native component' },
    { route: 'variants', title: 'Variants', description: 'useVariants, compound, default and boolean variants' },
    { route: 'dynamic-functions', title: 'Dynamic functions', description: 'One function shared by many views (#1192)' },
    { route: 'breakpoints', title: 'Breakpoints', description: 'Breakpoints, mq, Display and Hide' },
    { route: 'runtime', title: 'Runtime', description: 'rt in styles, updateTheme, adaptive themes' },
    { route: 'scoped-theme', title: 'Scoped theme', description: 'Named, inverted adaptive, reset and nested scopes' },
    { route: 'with-unistyles', title: 'withUnistyles', description: 'Third party components and useUnistyles' },
    { route: 'animations', title: 'Animations', description: 'Animated, Reanimated and useAnimatedTheme' },
    { route: 'lists', title: 'Lists', description: 'ScrollView, FlatList and SectionList' },
    { route: 'transition', title: 'Transition', description: 'Unistyles commits during a transition render' },
    { route: 'suspense', title: 'Suspense', description: 'Theme changes while content is suspended (#1260)' },
    { route: 'activity', title: 'Activity', description: 'Theme changes and renders while <Activity> hides content' },
    { route: 'session', title: 'Frozen session', description: 'Frozen stack, shared styles, log out while frozen (#1262, #1217)' }
] as const

export type ScreenRoute = typeof screens[number]['route']
