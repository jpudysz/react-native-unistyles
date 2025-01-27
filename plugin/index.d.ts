export interface UnistylesPluginOptions {
    /**
     * Example: "src" or "apps/mobile"
     * Add this option if some of your components don't have `react-native-unistyles` import.
     * Babel plugin will automatically process all files under this root.
     */
    autoProcessRoot?: string

  /**
   * Example: ['@codemask/styles']
   * Enable this option if you want to process only files containing specific imports.
   */
  autoProcessImports?: string[]

  /**
   * Example: ['external-library/components']
   * Enable this option to process some 3rd party components under `node_modules`.
   * Under these paths we will replace `react-native` imports with `react-native-unistyles` factories that will borrow components refs [read more](https://www.unistyl.es/v3/other/babel-plugin#3-component-factory-borrowing-ref).
   *
   * Defaults to:
   *
   * ```ts
   * ['react-native-reanimated/src/component', 'react-native-gesture-handler/src/components']
   * ```
   */
  autoProcessPaths?: string[];

  /**
   * In order to list detected dependencies by the Babel plugin you can enable the `debug` flag.
   * It will `console.log` name of the file and component with Unistyles dependencies.
   */
  debug?: boolean;

  /**
   * Only applicable for Unistyles monorepo for
   * path resolution, don't use it!
   */
  isLocal?: boolean;
}

export interface UnistylesPluginPass {
  opts: UnistylesPluginOptions;
}
