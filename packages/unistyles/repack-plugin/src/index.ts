import { unistylesLoader } from './loader'

export { UnistylesPlugin } from './unistylesPlugin'
export { BASE_REPACK_EXCLUDE_PATHS, RepackUnistylePlugin } from './repackUnistylePlugin'

// the loader of the deprecated RepackUnistylePlugin, its rules load `react-native-unistyles/repack-plugin`
export default unistylesLoader
