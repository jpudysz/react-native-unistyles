const STYLE_RESOURCE_IDS = Symbol.for('react-native-unistyles.style-resource-ids')

type StyleResourceGlobal = typeof globalThis & {
    [STYLE_RESOURCE_IDS]?: WeakMap<object, string>
}

const styleResourceGlobal = globalThis as StyleResourceGlobal
const styleResourceIds = styleResourceGlobal[STYLE_RESOURCE_IDS] ?? new WeakMap<object, string>()

styleResourceGlobal[STYLE_RESOURCE_IDS] = styleResourceIds

export const UNISTYLES_PRECEDENCE = 'unistyles'
export const UNISTYLES_RESOURCE_ANCHOR_ID = 'unistyles-resource-anchor'

export const getStyleResourceId = (metadata: unknown) => {
    if (typeof metadata !== 'object' || metadata === null) {
        return undefined
    }

    return styleResourceIds.get(metadata)
}

export const setStyleResourceId = <T extends object>(metadata: T, resourceId: string) => {
    // Keep exact rule ownership outside React Native Web style metadata. Even a
    // non-enumerable Symbol is rejected by React Flight when the metadata is
    // passed from a Server Component to a Client Component.
    styleResourceIds.set(metadata, resourceId)

    return metadata
}
