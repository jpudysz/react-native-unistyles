import React from 'react'
import { getClassName } from './getClassname'
import type { UnistylesValues } from '../types'
import { isServer } from '../web/utils'

type ComponentProps = {
    style?: UnistylesValues | Array<UnistylesValues>
}

export const createUnistylesImageBackground = (Component: any) => React.forwardRef<HTMLElement, ComponentProps>((props, forwardedRef) => {
    let storedRef: HTMLElement | null = null
    let storedImageRef: HTMLElement | null = null
    const classNames = getClassName(props.style)
    const imageClassNames = getClassName(props.style)

    return (
        <Component
            {...props}
            style={classNames}
            imageStyle={imageClassNames}
            imageRef={isServer() ? undefined : (ref: HTMLElement | null) => {
                if (!ref) {
                    // @ts-expect-error hidden from TS
                    UnistylesShadowRegistry.remove(storedImageRef, imageClassNames?.hash)
                }

                storedImageRef = ref
                // @ts-expect-error hidden from TS
                UnistylesShadowRegistry.add(ref, imageClassNames?.hash)

                if (typeof forwardedRef === 'function') {
                    return forwardedRef(ref)
                }

                if (forwardedRef) {
                    forwardedRef.current = ref
                }
            }}
            ref={isServer() ? undefined : (ref: HTMLElement | null) => {
                if (!ref) {
                    // @ts-expect-error hidden from TS
                    UnistylesShadowRegistry.remove(storedRef, classNames?.hash)
                }

                storedRef = ref
                // @ts-expect-error hidden from TS
                UnistylesShadowRegistry.add(ref, classNames?.hash)

                if (typeof forwardedRef === 'function') {
                    return forwardedRef(ref)
                }

                if (forwardedRef) {
                    forwardedRef.current = ref
                }
            }}
        />
    )
})
