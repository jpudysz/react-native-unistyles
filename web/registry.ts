import { createTypeStyle, TypeStyle } from 'typestyle'
import type { UnistylesValues } from '../src/types'
import { convertToTypeStyle } from './utils'

class UnistylesRegistryBuilder {
    createStyles = (stylesheet: UnistylesValues, key: string | number) => {
        const stylesTag = document.createElement('style')
        const unistyles = createTypeStyle(stylesTag)
        const typestyleStylesheet = convertToTypeStyle(stylesheet)
        const className = unistyles.style({
            $debugName: String(key),
            ...typestyleStylesheet
        })

        document.head.appendChild(stylesTag)

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
