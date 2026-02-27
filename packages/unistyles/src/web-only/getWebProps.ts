import type { StyleProp } from 'react-native'

import type { RNStyle, UnistylesValues } from '../types'

import { getClassName } from '../core'
import { createUnistylesRef } from '../web/utils/createUnistylesRef'

export const getWebProps = <T>(style: StyleProp<RNStyle>, forwardedRef?: React.ForwardedRef<T>) => {
    const styles = getClassName(style as UnistylesValues)
    const ref = createUnistylesRef<T>(styles, forwardedRef)
    const [generatedStyles] = styles ?? []

    return {
        className: [generatedStyles?.hash, generatedStyles?.injectedClassName].filter(Boolean).join(' '),
        ref,
    }
}
