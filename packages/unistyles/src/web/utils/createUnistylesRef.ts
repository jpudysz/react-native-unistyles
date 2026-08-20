import type React from 'react'

import type { Nullable, UnistylesValues } from '../../types'

import * as unistyles from '../services'
import { getStyleResourceId } from '../styleResource'
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
    const resourceId = getStyleResourceId(classNames) ?? classNames?.hash

    return isServer()
        ? undefined
        : (ref: Nullable<T>) => {
              if (!ref) {
                  unistyles.services.shadowRegistry.remove(storedRef.current, resourceId)
              }

              storedRef.current = ref
              unistyles.services.shadowRegistry.add(ref, resourceId)

              if (typeof forwardedRef === 'function') {
                  return forwardedRef(ref)
              }

              if (forwardedRef) {
                  forwardedRef.current = ref
              }
          }
}
