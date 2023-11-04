import type { NavigationProp } from '@react-navigation/native'

export enum DemoNames {
    Home = 'Home',
    NoThemes = 'NoThemes',
    SingleTheme = 'SingleTheme',
    TwoThemes = 'TwoThemes',
    LightDarkThemes = 'LightDarkThemes',
    MultipleThemes = 'MultipleThemes'
}

export type DemoStackParams = {
    [DemoNames.Home]: undefined,
    [DemoNames.NoThemes]: undefined,
    [DemoNames.SingleTheme]: undefined,
    [DemoNames.TwoThemes]: undefined,
    [DemoNames.LightDarkThemes]: undefined,
    [DemoNames.MultipleThemes]: undefined
}

export type NavigationProps<S extends DemoNames = DemoNames.Home> = NavigationProp<DemoStackParams, S>
