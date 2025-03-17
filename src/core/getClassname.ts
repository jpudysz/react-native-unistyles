import type { UnistylesValues } from '../types'
import { UnistylesWeb } from '../web'

export const getClassName = (unistyle: UnistylesValues | undefined | Array<UnistylesValues>, forChild?: boolean) => {
    if (!unistyle) {
        return undefined
    }

    const { hash, injectedClassName } = UnistylesWeb.shadowRegistry.addStyles(
        Array.isArray(unistyle) ? unistyle.flat(Number.POSITIVE_INFINITY) : [unistyle],
        forChild
    )

    return hash ? { $$css: true, hash, injectedClassName } : undefined
}
