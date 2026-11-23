import type { UnistylesValues } from '../types'
import type { UnistylesListener } from './listener'
import type { UnistylesRegistry } from './registry'
import type { UnistylesRuntime } from './runtime'
import type { UnistylesShadowRegistry } from './shadowRegistry'
import type { UnistylesState } from './state'

export type UnistylesServices = {
    runtime: UnistylesRuntime
    registry: UnistylesRegistry
    shadowRegistry: UnistylesShadowRegistry
    state: UnistylesState
    listener: UnistylesListener
}

export const UNI_GENERATED_KEYS = ['$$css', 'hash', 'injectedClassName'] as const
export type UniGeneratedKey = (typeof UNI_GENERATED_KEYS)[number]

// Required for the Metro integration: marks display: contents elements for the forChild selector
export const CONTENTS_CLASS_NAME = 'unistyles-contents'

export type UniGeneratedStyle = Record<UniGeneratedKey, string> & {
    parsedStyles?: UnistylesValues
}
