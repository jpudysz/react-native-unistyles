import { getModulePaths } from '@callstack/repack'
import type { Compiler, RspackPluginInstance, LoaderContext } from '@rspack/core'
import type { UnistylesPluginOptions } from 'react-native-unistyles/plugin'

export declare const BASE_REPACK_EXCLUDE_PATHS: Array<RegExp>

type RuleExcludePaths = ReturnType<typeof getModulePaths>

interface ConstructorParams {
    ruleExcludePaths?: RuleExcludePaths
    unistylesPluginOptions?: UnistylesPluginOptions
}

export declare class RepackUnistylePlugin implements RspackPluginInstance {
    private ruleExcludePaths
    private unistylesPluginOptions
    constructor({ ruleExcludePaths, unistylesPluginOptions }?: ConstructorParams)
    apply(compiler: Compiler): void
}

declare function unistylesLoader(this: LoaderContext<UnistylesLoaderOptions>, source: string): void;

export default unistylesLoader
