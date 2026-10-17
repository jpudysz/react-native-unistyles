// React 19 fiber shapes, just the fields Unistyles (through unifiber) reads
export const Tag = {
    ClassComponent: 1,
    HostRoot: 3,
    HostComponent: 5,
    Fragment: 7,
    ContextProvider: 10,
    Suspense: 13,
    Offscreen: 22,
    Activity: 31,
} as const

export type TestFiber = {
    tag: number
    type: any
    return: TestFiber | null
    child: TestFiber | null
    sibling: TestFiber | null
    alternate: TestFiber | null
    stateNode: any
    memoizedProps: any
    pendingProps: any
    memoizedState: any
}

let nextTag = 1

export const fiber = (tag: number, fields: Partial<TestFiber> = {}): TestFiber => ({
    tag,
    type: null,
    return: null,
    child: null,
    sibling: null,
    alternate: null,
    stateNode: null,
    memoizedProps: {},
    pendingProps: {},
    memoizedState: null,
    ...fields,
})

export const hostFiber = (node: object, props: Record<string, unknown> = {}): TestFiber => {
    const host = fiber(Tag.HostComponent, { memoizedProps: props, pendingProps: props })
    const publicInstance = { __internalInstanceHandle: host }

    host.stateNode = { node, canonical: { nativeTag: nextTag++, internalInstanceHandle: host, publicInstance } }

    return host
}

// links each fiber to the next one as its parent: chain(leaf, parent, ..., root)
export const chain = (...fibers: Array<TestFiber>) => {
    for (let i = 0; i < fibers.length - 1; i++) {
        const child = fibers[i]!
        const parent = fibers[i + 1]!

        child.return = parent
        child.sibling = parent.child
        parent.child = child
    }

    return fibers[0]!
}

export const root = () => fiber(Tag.HostRoot, { stateNode: {} })

// the ref a host view hands to its ref callback
export const refOf = (host: TestFiber) =>
    host.stateNode.canonical.publicInstance as { __internalInstanceHandle: TestFiber }

// react-freeze: Freeze > Suspense > Offscreen (hidden while frozen) > Suspender > children
export const frozenScreen = (child: TestFiber, parent: TestFiber, frozen = true) => {
    const freeze = fiber(Tag.ClassComponent, { memoizedProps: { freeze: frozen } })
    const suspense = fiber(Tag.Suspense, { memoizedState: frozen ? {} : null })
    const offscreen = fiber(Tag.Offscreen, { memoizedState: frozen ? {} : null })
    const suspender = fiber(Tag.ClassComponent, { memoizedProps: { freeze: frozen } })

    chain(child, suspender, offscreen, suspense, freeze, parent)

    return child
}
