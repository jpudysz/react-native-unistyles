import type { LoaderContext } from '@rspack/core'

import { transform } from '@babel/core'

import type { UnistylesPluginOptions } from '../../plugin'

import { REACT_NATIVE_COMPONENT_NAMES, REPLACE_WITH_UNISTYLES_PATHS } from '../../plugin/src/consts'

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

    transform(
        source,
        {
            filename: this.resourcePath,
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

            //@ts-ignore
            callback(null, result.code, result.map)
            return
        },
    )
}
