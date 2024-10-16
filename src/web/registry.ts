import { createTypeStyle, TypeStyle } from 'typestyle'
import type { UnistylesValues } from '../types'
import { convertToTypeStyle } from './convert'

class UnistylesRegistryBuilder {
    createStyles = (stylesheet: UnistylesValues, key: string) => {
        const unistyles = createTypeStyle()
        const typestyleStylesheet = convertToTypeStyle(stylesheet)

        const className = unistyles.style({
            $debugName: `${key}-${Math.random().toString(16).slice(10)}`,
        }, typestyleStylesheet)

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
