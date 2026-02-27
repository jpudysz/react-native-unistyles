import { createContext, useContext, useRef, useSyncExternalStore } from 'react'

type ContainerBreakpointStore = {
    subscribe: (callback: () => void) => () => void
    getSnapshot: () => string | undefined
}

export const ContainerBreakpointContext = createContext<ContainerBreakpointStore | null>(null)

export const useContainerBreakpointStore = () => {
    const storeRef = useRef<{
        store: ContainerBreakpointStore
        emit: (breakpoint: string | undefined) => void
    } | null>(null)

    if (!storeRef.current) {
        const listeners = new Set<() => void>()
        let currentBreakpoint: string | undefined = undefined

        storeRef.current = {
            store: {
                subscribe: (callback: () => void) => {
                    listeners.add(callback)
                    return () => listeners.delete(callback)
                },
                getSnapshot: () => currentBreakpoint
            },
            emit: (breakpoint: string | undefined) => {
                if (currentBreakpoint === breakpoint) {
                    return
                }

                currentBreakpoint = breakpoint
                listeners.forEach(listener => listener())
            }
        }
    }

    return storeRef.current
}

export const useContainerBreakpoint = (): string | undefined => {
    const store = useContext(ContainerBreakpointContext)

    return useSyncExternalStore(
        store?.subscribe ?? emptySubscribe,
        store?.getSnapshot ?? emptySnapshot
    )
}

const emptySubscribe = (_cb: () => void) => () => {}
const emptySnapshot = () => undefined
