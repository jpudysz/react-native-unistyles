import React, { act } from 'react'

import { Pressable } from '../components/native/Pressable'
import { getHash, getRegisteredNodes, hasCSSRule, render, stylesCounter } from './web-utils'

describe('Pressable (web)', () => {
    it('registers the node under its style hash', async () => {
        const { node, unmount } = render(<Pressable style={{ height: 101 }} />)

        expect(stylesCounter.get(getHash(node))).toEqual(new Set([node]))

        await unmount()
    })

    it('moves the node to the new hash when the style changes', async () => {
        const { node, rerender, unmount } = render(<Pressable style={{ height: 102 }} />)
        const firstHash = getHash(node)

        rerender(<Pressable style={{ height: 103 }} />)
        await act(async () => {})

        const secondHash = getHash(node)

        expect(stylesCounter.get(firstHash)?.size ?? 0).toBe(0)
        expect(stylesCounter.get(secondHash)).toEqual(new Set([node]))
        expect(hasCSSRule(firstHash)).toBe(false)
        expect(hasCSSRule(secondHash)).toBe(true)

        await unmount()
    })

    it('releases the node and the CSS rule on unmount', async () => {
        const { node, rerender, unmount } = render(<Pressable style={() => ({ height: 104 })} />)

        rerender(<Pressable style={() => ({ height: 105 })} />)

        const hash = getHash(node)

        await unmount()

        expect(getRegisteredNodes()).not.toContain(node)
        expect(hasCSSRule(hash)).toBe(false)
    })

    it('passes the node to the forwarded ref', async () => {
        const ref = React.createRef<any>()
        const { node, unmount } = render(<Pressable ref={ref} style={{ height: 106 }} />)

        expect(ref.current).toBe(node)

        await unmount()

        expect(ref.current).toBeNull()
    })
})
