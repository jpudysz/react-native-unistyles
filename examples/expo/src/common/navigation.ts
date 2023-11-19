import type { NavigationProp } from '@react-navigation/native'

export enum DemoNames {
    Home = 'Home',
    NoThemes = 'NoThemes',
    SingleTheme = 'SingleTheme',
    TwoThemes = 'TwoThemes',
    LightDarkThemes = 'LightDarkThemes',
    MultipleThemes = 'MultipleThemes',
    MultipleThemesAdaptive = 'MultipleThemesAdaptive',
    NoBreakpoints = 'NoBreakpoints',
    WithBreakpoints = 'WithBreakpoints',
    MediaQueriesWidthHeight = 'MediaQueriesWidthHeight',
    OrientationBreakpoints = 'OrientationBreakpoints',
    MixedMediaQueries = 'MixedMediaQueries',
    Variants = 'Variants',
    DefaultVariant = 'DefaultVariant',
    AutoGuidelinePlugin = 'AutoGuidelinePlugin',
    HighContrastPlugin = 'HighContrastPlugin',
    Runtime = 'Runtime',
    RuntimeWithStyleSheet = 'RuntimeWithStyleSheet',
    Benchmark = 'Benchmark'
}

export type DemoStackParams = {
    [DemoNames.Home]: undefined,
    [DemoNames.NoThemes]: undefined,
    [DemoNames.SingleTheme]: undefined,
    [DemoNames.TwoThemes]: undefined,
    [DemoNames.LightDarkThemes]: undefined,
    [DemoNames.MultipleThemes]: undefined,
    [DemoNames.MultipleThemesAdaptive]: undefined,
    [DemoNames.NoBreakpoints]: undefined,
    [DemoNames.WithBreakpoints]: undefined,
    [DemoNames.MediaQueriesWidthHeight]: undefined,
    [DemoNames.OrientationBreakpoints]: undefined,
    [DemoNames.MixedMediaQueries]: undefined,
    [DemoNames.Variants]: undefined,
    [DemoNames.DefaultVariant]: undefined,
    [DemoNames.AutoGuidelinePlugin]: undefined,
    [DemoNames.HighContrastPlugin]: undefined,
    [DemoNames.Runtime]: undefined,
    [DemoNames.RuntimeWithStyleSheet]: undefined,
    [DemoNames.Benchmark]: undefined
}

export type NavigationProps<S extends DemoNames = DemoNames.Home> = NavigationProp<DemoStackParams, S>
