interface RemapImport {
    /**
     * The target import name if `isDefault` is false.
     */
    name?: string

    /**
     * Whether the import is default.
     */
    isDefault: boolean

    /**
     * The path to the target import.
     */
    path: string

    /**
     * The name of the Unistyles component, check `react-native-unistyles/src/components/native`
     */
    mapTo: string
}

/**
 * A more powerful API that allows converting unmatched imports to Unistyles.
 */
export interface RemapConfig {
    /**
     * The node_modules path.
     */
    path: string

    /**
     * An array of import objects with the following properties:
     */
    imports: Array<RemapImport>
}

/**
 * Options of the Babel plugin `react-native-unistyles/plugin`
 *
 * @deprecated since 3.9.0, removed in 4.0. With Metro use `withUnistylesConfig` from `react-native-unistyles/metro`,
 * with Re.Pack, Rspack or Rsbuild use `UnistylesPlugin` from `react-native-unistyles/repack-plugin`, both have no options.
 * Other bundlers (eg. Next.js, Vite or webpack) don't have a replacement yet, the Babel plugin keeps working in 3.x.
 * See https://www.unistyl.es/v3/other/babel-plugin
 */
export interface UnistylesPluginOptions {
    /**
     * Required from RC.5
     * Example: 'src' or 'app'
     * Add root folder of your project. All files under this folder will be processed by the Babel plugin.
     * If you need to process extra folders, use with `autoProcessPaths` option.
     */
    root: string

    /**
     * Example: ['@my-org/styles']
     * Enable this option if you want to process only files containing specific imports.
     */
    autoProcessImports?: Array<string>

    /**
     * Example:
     * ```js
     * [{
     *     path: 'node_modules/custom-library/components',
     *     imports: [
     *         {
     *             name: 'NativeText',
     *             isDefault: false,
     *             path: 'react-native/Libraries/Text/TextNativeComponent',
     *             mapTo: 'NativeText'
     *         },
     *         {
     *             isDefault: true,
     *             path: 'react-native/Libraries/Components/View/ViewNativeComponent',
     *             mapTo: 'NativeView'
     *         }
     *     ]
     * }]
     * ```
     *
     * Will map:
     *
     * ```js
     * import { NativeText } from 'react-native/Libraries/Text/TextNativeComponent'
     * ```
     *
     * to Unistyles 'NativeText'
     *
     * and
     *
     * ```js
     * import View from 'react-native/Libraries/Components/View/ViewNativeComponent'
     * ```
     *
     * to Unistyles 'NativeView'
     *
     * This is the most powerful way of remapping imports. If 3rd party library uses imports different from `react-native` we can remap them to `react-native-unistyles` factories.
     * Internally we do that for raw RCTView and RCTText components.
     *
     * path -> must be within node_modules folder
     * imports.name is Optional if library used export default
     * imports.mapTo - name of the component from react-native-unistyles/src/components/native
     */
    autoRemapImports?: Array<RemapConfig>

    /**
     * Example: ['external-library/components']
     * Enable this option to process some 3rd party components under `node_modules`.
     * Under these paths we will replace `react-native` imports with `react-native-unistyles` factories that will borrow components refs [read more](https://www.unistyl.es/v3/other/babel-plugin#2-component-factory-borrowing-ref).
     *
     * The following paths are always processed, and paths passed here are added to them:
     *
     * ```ts
     * ['react-native-reanimated/src/component', 'react-native-reanimated/lib/module/component']
     * ```
     */
    autoProcessPaths?: Array<string>

    /**
     * In order to list detected dependencies by the Babel plugin you can enable the `debug` flag.
     * It will `console.log` name of the file and component with Unistyles dependencies.
     */
    debug?: boolean

    /**
     * Only applicable for Unistyles monorepo for
     * path resolution, don't use it!
     */
    isLocal?: boolean

    /**
     * Absolute path to the local package root.
     * Used with `isLocal` for monorepo development to resolve component imports.
     */
    localPath?: string
}

/**
 * The Babel plugin of Unistyles, add it to `plugins` of babel.config.js: `['react-native-unistyles/plugin', { root: 'src' }]`
 *
 * @deprecated since 3.9.0, removed in 4.0. With Metro use `withUnistylesConfig` from `react-native-unistyles/metro`,
 * with Re.Pack, Rspack or Rsbuild use `UnistylesPlugin` from `react-native-unistyles/repack-plugin`.
 * Other bundlers (eg. Next.js, Vite or webpack) don't have a replacement yet, the Babel plugin keeps working in 3.x.
 * See https://www.unistyl.es/v3/other/babel-plugin
 */
declare function unistylesPlugin(api?: object): { name: string; visitor: object }

export default unistylesPlugin
