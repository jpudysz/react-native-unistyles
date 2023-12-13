import { useRef } from 'react'
import type { Optional } from '../types'

export const useVariants = (variantsMap?: Record<string, Optional<string>>) => {
    const variantsRef = useRef<Optional<Record<string, Optional<string>>>>(variantsMap)

    variantsRef.current = variantsMap

    return variantsRef.current
}
