import type React from 'react'
import type { Nullable } from '../../types'
import { UnistylesWeb } from '../index'
import { isServer } from './common'

type ClassNames = {
    hash: string
}

export const createUnistylesRef = <T>(classNames?: ClassNames, forwardedRef?: React.ForwardedRef<T>) => {
    const storedRef = { current: null as Nullable<T> }

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
