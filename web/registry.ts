import { createTypeStyle, TypeStyle } from 'typestyle'
import type { UnistylesValues } from '../src/types'
import { convertToTypeStyle } from './convert'
import { UnistylesState } from './state'

class UnistylesRegistryBuilder {
    createStyles = (stylesheet: UnistylesValues, key: string | number) => {
        const stylesTag = UnistylesState.createTag()
        const unistyles = createTypeStyle(stylesTag)
        const typestyleStylesheets = convertToTypeStyle(stylesheet)
        const className = unistyles.style({
            $debugName: String(key),
        }, ...typestyleStylesheets)

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
        const typestyleStylesheets = convertToTypeStyle(stylesheet)

        unistyles.reinit()
        unistyles.cssRule(`.${className}`, ...typestyleStylesheets)
    }
}

export const UnistylesRegistry = new UnistylesRegistryBuilder()
