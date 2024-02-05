import { NativeModules, TurboModuleRegistry } from 'react-native'

type UnistylesNativeModule = {
    install(): boolean
}

// while debugging modules will default to NativeModules
// without debugging/in release mode module will be available in TurboModules
export const UnistylesModule = (TurboModuleRegistry.getEnforcing('Unistyles') ?? NativeModules?.Unistyles) as UnistylesNativeModule
