import { createTypeStyle, TypeStyle } from 'typestyle'
import type { UnistylesValues } from '../types'
import { convertToTypeStyle } from './convert'
import { UnistylesState } from './state'

class UnistylesRegistryBuilder {
    createStyles = (stylesheet: UnistylesValues, key: string) => {
        const stylesTag = UnistylesState.createTag()
        const unistyles = createTypeStyle(stylesTag)
        const typestyleStylesheet = convertToTypeStyle(stylesheet)

        const className = unistyles.style({
            $debugName: String(key),
        }, typestyleStylesheet)

        if (stylesheet._web?._css) {
            const customClassName = Array.isArray(stylesheet._web._css)
                ? stylesheet._web._css.join(' ')
                : stylesheet._web._css

            return {
                className: `${className} ${customClassName}`,
                unistyles
            }
        }

        return {
            className,
            unistyles
        }
    }

    updateStyles = (unistyles: TypeStyle, stylesheet: UnistylesValues, className: string) => {
        const typestyleStylesheet = convertToTypeStyle(stylesheet)

        unistyles.reinit()
        unistyles.cssRule(`.${className}`, typestyleStylesheet)
    }
}

export const UnistylesRegistry = new UnistylesRegistryBuilder()
