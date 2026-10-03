import React, { act } from 'react'
import { createRoot } from 'react-dom/client'

import { services } from '../web/services'

// @ts-expect-error private field
export const stylesCounter = services.registry.stylesCounter as Map<string, Set<HTMLElement>>

export const getRegisteredNodes = () => Array.from(stylesCounter.values()).flatMap((nodes) => Array.from(nodes))
export const getHash = (node: Element) =>
    Array.from(node.classList).find((className) => className.startsWith('unistyles_'))!
export const hasCSSRule = (hash: string) => services.registry.css.getStyles().includes(hash)

export const render = (element: React.ReactNode) => {
    const container = document.createElement('div')
    const root = createRoot(container)

    document.body.appendChild(container)
    act(() => root.render(element))

    return {
        node: container.firstElementChild as HTMLElement,
        rerender: (nextElement: React.ReactNode) => act(() => root.render(nextElement)),
        unmount: async () => {
            act(() => root.unmount())
            container.remove()
            // registry removes CSS rules in a microtask
            await act(async () => {})
        },
    }
}
