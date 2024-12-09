export type StateNode = {
    node?: ShadowNode
}

export type ShadowNode = {
    __hostObjectShadowNodeWrapper: any
}

export type ViewHandle = {
    __internalInstanceHandle?: {
        stateNode?: StateNode,
        elementType?: string
    },
    getScrollResponder?: () => {
        getNativeScrollRef?: () => ({
            __internalInstanceHandle?: {
                stateNode?: StateNode
            }
        })
    },
    getNativeScrollRef?: () => ({
        __internalInstanceHandle?: {
            stateNode?: StateNode
        }
    }),
    _viewRef?: {
        __internalInstanceHandle?: {
            stateNode?: StateNode
        }
    },
    viewRef?: {
        current?: {
            __internalInstanceHandle?: {
                stateNode?: StateNode
            }
        }
    },
    _nativeRef?: {
        __internalInstanceHandle?: {
            stateNode?: StateNode
        }
    }
}

export type Unistyle = {
    __unid?: number,
    initial?: {
        updater?: () => void
    }
}
