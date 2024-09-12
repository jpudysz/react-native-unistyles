export type StateNode = {
    node?: {
        __hostObjectShadowNodeWrapper: any
    }
}

export type ViewHandle = {
    __internalInstanceHandle?: {
        stateNode?: StateNode
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
}
