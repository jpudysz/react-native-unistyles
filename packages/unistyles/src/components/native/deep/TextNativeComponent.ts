// react-native-unistyles/metro resolves direct imports of react-native/Libraries/Text/TextNativeComponent here,
// its other exports (eg. NativeVirtualText) stay untouched
// @ts-ignore deep imports are typed only by some React Native versions
export * from 'react-native/Libraries/Text/TextNativeComponent'
export { NativeText } from '../NativeText'
