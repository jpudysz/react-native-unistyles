import { createTypeStyle, TypeStyle } from 'typestyle'
import type { UnistylesValues } from '../src/types'
import { convertToTypeStyle } from './utils'

class UnistylesRegistryBuilder {
    create(stylesheet: UnistylesValues, key: string | number) {
        const stylesTag = document.createElement('style')
        const unistyles = createTypeStyle(stylesTag)
        const className = this.updateStyles(unistyles, stylesheet, key)

        document.head.appendChild(stylesTag)

        return {
            className,
            unistyles
        }
    }

    updateStyles(unistyles: TypeStyle, stylesheet: UnistylesValues, key: string | number) {
        const typestyleStylesheet = convertToTypeStyle(stylesheet)
        unistyles.reinit()

        return unistyles.style({
            $debugName: String(key),
            ...typestyleStylesheet
        })
    }
}

export const UnistylesRegistry = new UnistylesRegistryBuilder()
