import { useSyncExternalStore } from 'react'

let isLoggedIn = true
const listeners = new Set<() => void>()

const setLoggedIn = (value: boolean) => {
    isLoggedIn = value
    listeners.forEach(listener => listener())
}

export const session = {
    logIn: () => setLoggedIn(true),
    logOut: () => setLoggedIn(false),
    isLoggedIn: () => isLoggedIn
}

export const useIsLoggedIn = () => useSyncExternalStore(
    listener => {
        listeners.add(listener)

        return () => {
            listeners.delete(listener)
        }
    },
    () => isLoggedIn
)

// Gives the garbage collector something to do, so families released by React Native are really freed
export const churnMemory = () => {
    for (let round = 0; round < 20; round++) {
        const garbage = Array.from({ length: 20_000 }, (_, index) => ({ index, label: `item-${index}`, values: [index, index * 2] }))

        garbage.length = 0
    }

    // @ts-expect-error exposed by Hermes only
    globalThis.gc?.()
}
