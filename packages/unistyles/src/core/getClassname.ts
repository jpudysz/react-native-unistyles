import type { UnistylesValues } from '../types'

import * as unistyles from '../web/services'
import { getStyleResourceId, setStyleResourceId } from '../web/styleResource'
import { checkForAnimated } from '../web/utils'

export const getClassName = (unistyle: UnistylesValues | undefined | Array<UnistylesValues>, forChild?: boolean) => {
    if (!unistyle) {
        return undefined
    }

    const flattenedStyles = Array.isArray(unistyle) ? unistyle.flat(Number.POSITIVE_INFINITY) : [unistyle]
    const animatedStyles = flattenedStyles.filter(checkForAnimated)
    const regularStyles = flattenedStyles.filter((style) => !checkForAnimated(style))

    const generatedStyle = unistyles.services.shadowRegistry.addStyles(regularStyles, forChild)
    const { hash, injectedClassName } = generatedStyle

    if (!hash) {
        return undefined
    }

    const metadata = setStyleResourceId(
        { $$css: true, hash, injectedClassName },
        getStyleResourceId(generatedStyle) ?? hash,
    )

    return [metadata, animatedStyles] as const
}
