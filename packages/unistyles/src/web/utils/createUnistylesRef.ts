import type React from 'react'

import { useCallback, useLayoutEffect, useRef } from 'react'

import type { Nullable, UnistylesValues } from '../../types'

import * as unistyles from '../services'
import { isServer } from './common'

type Styles = readonly [
    {
        hash: string
    },
    Array<UnistylesValues>,
]

export const createUnistylesRef = <T>(styles?: Styles, forwardedRef?: React.ForwardedRef<T>) => {
    const storedRef = { current: null as Nullable<T> }
    const [classNames] = styles ?? []

    return isServer()
        ? undefined
        : (ref: Nullable<T>) => {
              if (!ref) {
                  unistyles.services.shadowRegistry.remove(storedRef.current, classNames?.hash)
              }

              storedRef.current = ref
              unistyles.services.shadowRegistry.add(ref, classNames?.hash)

              if (typeof forwardedRef === 'function') {
                  return forwardedRef(ref)
              }

              if (forwardedRef) {
                  forwardedRef.current = ref
              }
          }
}

const assignRef = <T>(ref: React.ForwardedRef<T> | undefined, value: Nullable<T>) => {
    if (typeof ref === 'function') {
        ref(value)

        return
    }

    if (ref) {
        ref.current = value
    }
}

// stable for the component lifetime, as some components (e.g. ScrollView on web) call only the latest ref on unmount
export const useUnistylesRef = <T>(hashes: Array<string | undefined>, forwardedRef?: React.ForwardedRef<T>) => {
    const storedRef = useRef<Nullable<T>>(null)
    const storedHashes = useRef(hashes)
    const storedForwardedRef = useRef(forwardedRef)
    const unistylesRef = useCallback((ref: Nullable<T>) => {
        if (!ref) {
            storedHashes.current.forEach((hash) => unistyles.services.shadowRegistry.remove(storedRef.current, hash))
        }

        storedRef.current = ref
        storedHashes.current.forEach((hash) => unistyles.services.shadowRegistry.add(ref, hash))
        assignRef(storedForwardedRef.current, ref)
    }, [])

    useLayoutEffect(() => {
        if (hashes.join() !== storedHashes.current.join()) {
            storedHashes.current.forEach((hash) => unistyles.services.shadowRegistry.remove(storedRef.current, hash))
            hashes.forEach((hash) => unistyles.services.shadowRegistry.add(storedRef.current, hash))
            storedHashes.current = hashes
        }

        if (forwardedRef !== storedForwardedRef.current) {
            assignRef(storedForwardedRef.current, null)
            assignRef(forwardedRef, storedRef.current)
            storedForwardedRef.current = forwardedRef
        }
    })

    return isServer() ? undefined : unistylesRef
}
