import type React from 'react'
import type { Nullable, UnistylesValues } from '../../types'
import { UnistylesWeb } from '../index'
import { isServer } from './common'

type Styles = readonly [
    {
        hash: string
    },
    Array<UnistylesValues>
]

export const createUnistylesRef = <T>(styles?: Styles, forwardedRef?: React.ForwardedRef<T>) => {
    const storedRef = { current: null as Nullable<T> }
    const [classNames] = styles ?? []

    return isServer() ? undefined : (ref: Nullable<T>) => {
        if (!ref) {
            UnistylesWeb.shadowRegistry.remove(storedRef, classNames?.hash)
        }

        storedRef.current = ref
        UnistylesWeb.shadowRegistry.add(ref, classNames?.hash)

        if (typeof forwardedRef === 'function') {
            return forwardedRef(ref)
        }

        if (forwardedRef) {
            forwardedRef.current = ref
        }
    }
}
