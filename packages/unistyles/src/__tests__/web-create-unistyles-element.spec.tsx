import React, { act } from 'react'

import { ScrollView } from '../components/native/ScrollView'
import { View } from '../components/native/View'
import { createUnistylesElement } from '../core'
import { getHash, getRegisteredNodes, hasCSSRule, render, stylesCounter } from './web-utils'

// like ScrollView from react-native-web: calls the latest ref prop only on mount and unmount
class MountOnlyRef extends React.Component<{ className?: string; forwardedRef?: React.Ref<HTMLDivElement> }> {
    private setNode = (node: HTMLDivElement | null) => {
        const { forwardedRef } = this.props

        if (typeof forwardedRef === 'function') {
            forwardedRef(node)
        }
    }

    render() {
        return <div className={this.props.className} ref={this.setNode} />
    }
}

const UnistylesMountOnlyRef = createUnistylesElement(({ style, ref }: any) => (
    <MountOnlyRef className={style?.[0]?.hash} forwardedRef={ref} />
))

describe('createUnistylesElement (web)', () => {
    it('releases a component that calls its ref only on mount and unmount', async () => {
        const { node, rerender, unmount } = render(<UnistylesMountOnlyRef style={{ height: 201 }} />)

        rerender(<UnistylesMountOnlyRef style={{ height: 202 }} />)

        const hash = getHash(node)

        expect(stylesCounter.get(hash)).toEqual(new Set([node]))

        await unmount()

        expect(getRegisteredNodes()).not.toContain(node)
        expect(hasCSSRule(hash)).toBe(false)
    })

    it('releases ScrollView after re-renders', async () => {
        const { node, rerender, unmount } = render(<ScrollView style={{ height: 211 }} />)

        rerender(<ScrollView style={{ height: 212 }} />)

        const hash = getHash(node)

        await unmount()

        expect(getRegisteredNodes()).not.toContain(node)
        expect(hasCSSRule(hash)).toBe(false)
    })

    it('releases ScrollView in StrictMode', async () => {
        const { node, rerender, unmount } = render(
            <React.StrictMode>
                <ScrollView style={{ height: 213 }} />
            </React.StrictMode>,
        )

        rerender(
            <React.StrictMode>
                <ScrollView style={{ height: 214 }} />
            </React.StrictMode>,
        )

        const hash = getHash(node)

        expect(stylesCounter.get(hash)).toEqual(new Set([node]))

        await unmount()

        expect(getRegisteredNodes()).not.toContain(node)
    })

    it('moves the node to the new hash when the style changes', async () => {
        const { node, rerender, unmount } = render(<View style={{ height: 221 }} />)
        const firstHash = getHash(node)

        rerender(<View style={{ height: 222 }} />)
        await act(async () => {})

        expect(stylesCounter.get(firstHash)?.size ?? 0).toBe(0)
        expect(stylesCounter.get(getHash(node))).toEqual(new Set([node]))
        expect(hasCSSRule(firstHash)).toBe(false)

        await unmount()
    })

    it('keeps the CSS rule while another node uses it', async () => {
        const { node, rerender, unmount } = render(
            <>
                <View style={{ height: 231 }} />
                <View style={{ height: 231 }} />
            </>,
        )
        const hash = getHash(node)

        rerender(<View style={{ height: 231 }} />)
        await act(async () => {})

        expect(hasCSSRule(hash)).toBe(true)

        await unmount()

        expect(hasCSSRule(hash)).toBe(false)
    })

    it('passes the node to the current forwarded ref', async () => {
        const firstRef = React.createRef<any>()
        const secondRef = React.createRef<any>()
        const { node, rerender, unmount } = render(<ScrollView ref={firstRef} style={{ height: 241 }} />)

        expect(firstRef.current).toBe(node)

        rerender(<ScrollView ref={secondRef} style={{ height: 241 }} />)

        expect(firstRef.current).toBeNull()
        expect(secondRef.current).toBe(node)

        await unmount()

        expect(secondRef.current).toBeNull()
    })
})
