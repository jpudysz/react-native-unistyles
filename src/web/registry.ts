import { createTypeStyle, TypeStyle } from 'typestyle'
import type { UnistylesValues } from '../types'
import { convertToTypeStyle } from './convert'
import type { StyleSheet, StyleSheetWithSuperPowers } from '../types/stylesheet'
import { UnistylesRuntime } from './runtime'
import { keyInObject } from './utils'
import { UnistylesListener } from './listener'

class UnistylesRegistryBuilder {
    private stylesheets = new Map<StyleSheetWithSuperPowers<StyleSheet>, StyleSheet>()

    getComputedStylesheet = (stylesheet: StyleSheetWithSuperPowers<StyleSheet>) => {
        if (typeof stylesheet !== 'function') {
            return stylesheet
        }

        const computedStylesheet = this.stylesheets.get(stylesheet)

        if (computedStylesheet) {
            return computedStylesheet
        }

        const createdStylesheet = stylesheet(UnistylesRuntime.theme, UnistylesRuntime.miniRuntime)
        // @ts-expect-error uni__dependencies is hidden
        const dependencies = Object.values(createdStylesheet).flatMap(value => keyInObject(value, 'uni__dependencies') ? value.uni__dependencies : [])

        UnistylesListener.addListeners(dependencies, () => {
            const newComputedStylesheet = stylesheet(UnistylesRuntime.theme, UnistylesRuntime.miniRuntime)

            this.stylesheets.set(stylesheet, newComputedStylesheet)
        })

        this.stylesheets.set(stylesheet, createdStylesheet)

        return createdStylesheet
    }

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
