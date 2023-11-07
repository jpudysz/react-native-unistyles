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
            </Stack.Navigator>
        </NavigationContainer>
    </SafeAreaProvider>
)
