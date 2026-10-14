import nodePath from 'node:path'

import type { BabelTransformer, BabelTransformerArgs, UnistylesMetroOptions } from './types'

import plugin from '../../plugin/src/index'

// the plugin only rewrites `StyleSheet.create` calls (also of re-exported StyleSheets) and `styles.useVariants`
const MAYBE_UNISTYLES = /\.create\s*\(|\.useVariants\s*\(/

type TransformerConfig = {
    upstream: BabelTransformer
    options: UnistylesMetroOptions
    // real path of the react-native-unistyles package
    unistylesRoot: string
    // replaced by path.win32 in tests
    path?: typeof nodePath.posix
}

export const createBabelTransformer = ({ upstream, options, unistylesRoot, path = nodePath }: TransformerConfig) => {
    // one stable item, so Babel reuses the plugin instance between files
    const pluginItem = [plugin, { debug: options.debug, isMetro: true }, 'react-native-unistyles']

    const shouldProcess = ({ filename, src, options: { projectRoot } }: BabelTransformerArgs) => {
        if (!MAYBE_UNISTYLES.test(src)) {
            return false
        }

        // Metro passes a path relative to the project root
        const filePath = path.resolve(projectRoot, filename)

        // Unistyles creates its own StyleSheets
        if (filePath.startsWith(`${unistylesRoot}${path.sep}`)) {
            return false
        }

        // in node_modules only libraries built with Unistyles
        return !filePath.includes(`${path.sep}node_modules${path.sep}`) || src.includes('react-native-unistyles')
    }

    const transform = (args: BabelTransformerArgs) => {
        if (!shouldProcess(args)) {
            return upstream.transform(args)
        }

        return upstream.transform({
            ...args,
            plugins: [...(args.plugins ?? []), pluginItem],
        })
    }

    // Metro already hashes this file (with the bundled plugin) and the transformer config (with the options)
    const getCacheKey = (...args: Array<unknown>) => upstream.getCacheKey?.(...args) ?? ''

    return { shouldProcess, transform, getCacheKey }
}
