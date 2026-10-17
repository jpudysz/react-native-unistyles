import type { UnistylesValues } from '../types'

import * as unistyles from '../web/services'
import { checkForAnimated, isGeneratedUnistyle } from '../web/utils'

export const getClassName = (unistyle: UnistylesValues | undefined | Array<UnistylesValues>, forChild?: boolean) => {
    if (!unistyle) {
        return undefined
    }

    const flattenedStyles = Array.isArray(unistyle) ? unistyle.flat(Number.POSITIVE_INFINITY) : [unistyle]
    const animatedStyles = flattenedStyles.filter(checkForAnimated)
    const regularStyles = flattenedStyles.filter((style) => !checkForAnimated(style))
    const [firstStyle, ...otherStyles] = regularStyles

    // Already processed by an outer Unistyles component, e.g. createUnistylesElement(Animated.View),
    // styles added after it (like Reanimated's initial animated values) stay inline
    if (firstStyle && isGeneratedUnistyle(firstStyle)) {
        const { hash, injectedClassName } = firstStyle

        return hash
            ? ([{ $$css: true, hash, injectedClassName }, otherStyles.concat(animatedStyles)] as const)
            : undefined
    }

    const { hash, injectedClassName } = unistyles.services.shadowRegistry.addStyles(regularStyles, forChild)

    return hash ? ([{ $$css: true, hash, injectedClassName }, animatedStyles] as const) : undefined
}
