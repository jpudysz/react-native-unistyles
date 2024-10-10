import type { UnistylesValues } from '../types'
import { listenToDependencies } from './listener'
import { UnistylesRegistry } from './registry'
import { createDoubleMap, extractHiddenProperties, extractSecrets, isInDocument } from './utils'
import { getVariants } from './variants'

type WebUnistyle = ReturnType<typeof UnistylesRegistry.createStyles>


class UnistylesShadowRegistryBuilder {
    // MOCKS
    name = 'UnistylesShadowRegistry'
    __type = 'web'
    equals = () => true
    toString = () => 'UnistylesShadowRegistry'
    dispose = () => {}
    // END MOCKS

    private readonly webUnistylesMap = createDoubleMap<HTMLElement, string, WebUnistyle>()
    private readonly disposeMap = createDoubleMap<HTMLElement, string, VoidFunction | undefined>()
    private readonly stylesMap = createDoubleMap<HTMLElement, string, HTMLStyleElement>()

    add = (ref: any, style: UnistylesValues | ((...args: Array<any>) => UnistylesValues), uni_variants: Record<string, any> = {}, args: Array<any> = []) => {
        if (ref === null) {
            // Remove style tags from the document
            const { refs } = extractSecrets(style)

            refs.forEach(ref => {
                if (isInDocument(ref)) {
                    return
                }

                this.remove(ref, style)
            })

            return
        }

        if (!(ref instanceof HTMLElement)) {
            return
        }

        const { key, stylesheet, refs } = extractSecrets(style)
        const resultHidden = typeof style === 'function'
            ? style(...args)
            : style
        const result = extractHiddenProperties(resultHidden)
        const { variants } = Object.fromEntries(getVariants({ variants: result }, uni_variants))
        const resultWithVariants = {
            ...result,
            ...variants
        }
        const storedWebUnistyle = this.webUnistylesMap.get(ref, key)
        const webUnistyle = storedWebUnistyle ?? UnistylesRegistry.createStyles(resultWithVariants, key)

        this.webUnistylesMap.set(ref, key, webUnistyle)
        this.disposeMap.get(ref, key)?.()
        this.disposeMap.set(ref, key, listenToDependencies({
            key,
            stylesheet,
            args,
            className: webUnistyle.className,
            unistyles: webUnistyle.unistyles,
        }))

        if (!storedWebUnistyle) {
            const styleTag = document.createElement('style')

            ref.classList.add(webUnistyle.className)
            webUnistyle.unistyles.setStylesTarget(styleTag)
            document.head.appendChild(styleTag)
            refs.add(ref)
            this.stylesMap.set(ref, key, styleTag)
        }

        if (storedWebUnistyle) {
            UnistylesRegistry.updateStyles(webUnistyle.unistyles, resultWithVariants, webUnistyle.className)
        }
    }

    remove = (ref: HTMLElement, style: UnistylesValues | ((...args: Array<any>) => UnistylesValues)) => {
        const { key } = extractSecrets(style)

        this.webUnistylesMap.delete(ref, key)
        this.disposeMap.get(ref, key)?.()
        this.disposeMap.delete(ref, key)
        this.stylesMap.get(ref, key)?.remove()
        this.stylesMap.delete(ref, key)
    }
}

export const UnistylesShadowRegistry = new UnistylesShadowRegistryBuilder()
