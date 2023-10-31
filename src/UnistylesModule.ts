import { NativeModules } from 'react-native'

type UnistylesNativeModule = {
    install(): boolean
}

export const UnistylesModule = NativeModules?.Unistyles as UnistylesNativeModule
