export interface UnistylesPluginOptions {
  /**
   * By default babel plugin will look for any `react-native-unistyles` import to start processing your file.
   * However, in some cases you might want to process files that miss such import:
   * - ui-kits that aggregates Unistyles components
   * - monorepos that use Unistyles under absolute path like `@codemask/styles`
   *
   * If that's your case, you can configure the Babel plugin to process them.
   */
  autoProcessImports?: string[]

  /**
   * By default babel plugin will ignore `node_modules`.
   * However similar to `autoProcessImports`, you can configure it to process extra paths.
   *
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
