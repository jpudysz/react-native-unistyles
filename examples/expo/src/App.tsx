import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import * as Screens from './examples'
import { DemoNames } from './common'
import type { DemoStackParams } from './common'

const Stack = createNativeStackNavigator<DemoStackParams>()

export const App: React.FunctionComponent = () => (
    <SafeAreaProvider>
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName={DemoNames.Home}
                screenOptions={{
                    headerShown: false
                }}
            >
                <Stack.Screen name={DemoNames.Home} component={Screens.HomeScreen} />
                <Stack.Screen name={DemoNames.NoThemes} component={Screens.NoThemesScreen} />
                <Stack.Screen name={DemoNames.SingleTheme} component={Screens.SingleThemeScreen} />
                <Stack.Screen name={DemoNames.TwoThemes} component={Screens.TwoThemesScreen} />
                <Stack.Screen name={DemoNames.LightDarkThemes} component={Screens.LightDarkThemesScreen} />
                <Stack.Screen name={DemoNames.MultipleThemes} component={Screens.MultipleThemesScreen} />
                <Stack.Screen name={DemoNames.MultipleThemesAdaptive} component={Screens.MultipleThemesAdaptiveScreen} />
                <Stack.Screen name={DemoNames.NoBreakpoints} component={Screens.NoBreakpointsScreen} />
                <Stack.Screen name={DemoNames.WithBreakpoints} component={Screens.WithBreakpointsScreen} />
                <Stack.Screen name={DemoNames.OrientationBreakpoints} component={Screens.OrientationBreakpoints} />
                <Stack.Screen name={DemoNames.MediaQueriesWidthHeight} component={Screens.MediaQueriesWidthHeight} />
                <Stack.Screen name={DemoNames.MixedMediaQueries} component={Screens.MixedMediaQueries} />
                <Stack.Screen name={DemoNames.Variants} component={Screens.VariantsScreen} />
                <Stack.Screen name={DemoNames.DefaultVariant} component={Screens.DefaultVariantScreen} />
                <Stack.Screen name={DemoNames.AutoGuidelinePlugin} component={Screens.AutoGuidelinePluginScreen} />
                <Stack.Screen name={DemoNames.HighContrastPlugin} component={Screens.HighContrastPluginScreen} />
                <Stack.Screen name={DemoNames.Runtime} component={Screens.RuntimeScreen} />
                <Stack.Screen name={DemoNames.RuntimeWithStyleSheet} component={Screens.RuntimeWithStyleSheetScreen} />
                <Stack.Screen name={DemoNames.Benchmark} component={Screens.BenchmarkScreen} />
                <Stack.Screen name={DemoNames.BenchmarkAllFeatures} component={Screens.BenchmarkUnistylesAllFeaturesScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    </SafeAreaProvider>
)
