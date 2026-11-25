import type { LoaderContext } from '@rspack/core'

import type { UnistylesPluginOptions } from '../../plugin'

import {
    REACT_NATIVE_COMPONENT_NAMES,
    REPLACE_WITH_UNISTYLES_PATHS,
    REPACK_LOADER_CALLER,
} from '../../plugin/src/consts'

const importName = 'react-native-unistyles'

interface UnistylesLoaderOptions {
    babelPlugins?: string[]
    unistylesPluginOptions?: UnistylesPluginOptions
}

const UNISTYLES_REGEX = new RegExp(
    [...REACT_NATIVE_COMPONENT_NAMES, ...REPLACE_WITH_UNISTYLES_PATHS, importName].join('|'),
)

export function unistylesLoader(this: LoaderContext<UnistylesLoaderOptions>, source: string) {
    this.cacheable()
    const callback = this.async()
    const options = this.getOptions()

    if (!UNISTYLES_REGEX.test(source)) {
        callback(null, source)
        return
    }

    const unistylesOptions = options.unistylesPluginOptions

    const unistylesPlugin = unistylesOptions
        ? ['react-native-unistyles/plugin', unistylesOptions]
        : 'react-native-unistyles/plugin'

    const babelPlugins = options.babelPlugins ?? []

    // required by the deprecated RepackUnistylePlugin only, so Rspack and Rsbuild apps without Babel can import UnistylesPlugin
    const { transform } = require('@babel/core') as {
        transform: (
            code: string,
            options: Record<string, unknown>,
            callback: (error: Error | null, result: { code?: string | null; map?: unknown } | null) => void,
        ) => void
    }

    transform(
        source,
        {
            filename: this.resourcePath,
            // the Babel plugin doesn't repeat the deprecation warning of RepackUnistylePlugin
            caller: { name: REPACK_LOADER_CALLER },
            babelrc: false,
            configFile: false,
            compact: false,
            comments: true,
            plugins: [...babelPlugins, unistylesPlugin],
        },
        (err, result) => {
            if (err) {
                callback(err)
                return
            }

            callback(null, result?.code ?? undefined, result?.map as Parameters<typeof callback>[2])
            return
        },
    )
}
