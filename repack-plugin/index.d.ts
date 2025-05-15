import type { Compiler, RspackPluginInstance } from "@rspack/core";
import { getModulePaths } from "@callstack/repack";
import type { UnistylesPluginOptions } from "react-native-unistyles/plugin";
export declare const BASE_REPACK_EXCLUDE_PATHS: RegExp[];
type RuleExcludePaths = ReturnType<typeof getModulePaths>;
interface ConstructorParams {
    ruleExcludePaths?: RuleExcludePaths;
    unistylesPluginOptions?: UnistylesPluginOptions;
}
export declare class RepackUnistylePlugin implements RspackPluginInstance {
    private ruleExcludePaths;
    private unistylesPluginOptions;
    constructor({ ruleExcludePaths, unistylesPluginOptions }?: ConstructorParams);
    apply(compiler: Compiler): void;
}
export {};
