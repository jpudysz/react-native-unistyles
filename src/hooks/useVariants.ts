import { useRef } from 'react'
import type { Optional } from '../types'

const compareVariants = (prevVariants?: Record<string, Optional<string>>, nextVariants?: Record<string, Optional<string>>) => {
    const keysA = Object.keys(prevVariants ?? {})
    const keysB = Object.keys(nextVariants ?? {})

    if (keysA.length !== keysB.length) {
        return false
    }

    return keysA.every(key => prevVariants![key] === (nextVariants ?? {})[key])
}

export const useVariants = (variantsMap?: Record<string, Optional<string>>) => {
    const variantsRef = useRef<Optional<Record<string, Optional<string>>>>(variantsMap)

    if (!compareVariants(variantsRef.current, variantsMap)) {
        variantsRef.current = variantsMap
    }

    return variantsRef.current
}
