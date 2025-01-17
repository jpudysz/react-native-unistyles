export interface UnistylesPluginOptions {
  /**
   * Logs found dependencies in every StyleSheet
   */
  debug?: boolean;

  /**
   * Only applicable for Unistyles monorepo for
   * path resolution, don't use it!
   */
  isLocal?: boolean;

  /**
   * A list of imports that should trigger Unistyles
   * babel plugin eg. `@codemask/ui`
   */
  autoProcessImports?: string[]

  /**
   * A list of paths that should trigger Unistyles babel
   * plugin, check the default list defined in `REPLACE_WITH_UNISTYLES_PATHS`
   */
  autoProcessPaths?: string[];
}

export interface UnistylesPluginPass {
  opts: UnistylesPluginOptions;
}
