// react-native-unistyles/metro resolves direct imports of react-native/Libraries/Components/View/ViewNativeComponent here,
// its other exports stay untouched
// @ts-ignore deep imports are typed only by some React Native versions
export * from 'react-native/Libraries/Components/View/ViewNativeComponent'
export { NativeView as default } from '../NativeView'
