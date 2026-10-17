export type { ShadowNode } from '../../unifiber/src'

export type ViewHandle = {
    __internalInstanceHandle?: unknown
    constructor?: { name?: string }
}

export type Unistyle = {
    initial?: {
        updater?: () => void
    }
}
