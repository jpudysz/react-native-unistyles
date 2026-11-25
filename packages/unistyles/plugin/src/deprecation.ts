import type { ConfigAPI } from '@babel/core'

import { METRO_ENV, REPACK_LOADER_CALLER } from './consts'

const DEPRECATED = 'Unistyles 🦄: react-native-unistyles/plugin is deprecated and will be removed in Unistyles 4.0.'
const METRO =
    'With Metro, remove it from babel.config.js and wrap your metro.config.js with withUnistylesConfig from react-native-unistyles/metro, see https://www.unistyl.es/v3/other/metro'
const RSPACK =
    'With Re.Pack, Rspack or Rsbuild, use UnistylesPlugin from react-native-unistyles/repack-plugin, see https://www.unistyl.es/v3/other/repack'
const NO_REPLACEMENT =
    "Other bundlers (eg. Next.js, Vite or webpack) don't have a replacement yet, the Babel plugin keeps working there in Unistyles 3.x."

export const getDeprecationMessage = (callerName?: string) =>
    callerName === 'metro'
        ? `${DEPRECATED} ${METRO}`
        : [DEPRECATED, `${METRO}.`, `${RSPACK}.`, NO_REPLACEMENT].join(' ')

let hasWarned = false

// Babel creates the plugin for every config and file, warn once per process
export const warnDeprecation = (api?: ConfigAPI) => {
    if (hasWarned) {
        return
    }

    // the tests of Unistyles, Jest (NODE_ENV=test) skips the whole plugin
    if (process.env.NODE_ENV === 'babel-test') {
        return
    }

    // the plugin throws an error that names the integration to keep
    if (process.env[METRO_ENV]) {
        return
    }

    // Metro transforms files in jest-worker processes (ids from 1), every one of them would print the warning
    if (process.env.JEST_WORKER_ID && process.env.JEST_WORKER_ID !== '1') {
        return
    }

    const callerName = api?.caller?.((caller) => caller?.name)

    // the deprecated RepackUnistylePlugin runs the plugin and warns about itself
    if (callerName === REPACK_LOADER_CALLER) {
        return
    }

    hasWarned = true
    console.warn(getDeprecationMessage(callerName))
}
