import type { UnistylesValues } from '../types'
import { listenToDependencies } from './listener'
import { UnistylesRegistry } from './registry'
import { UnistylesRuntime } from './runtime'
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

    add = (ref: any, _style: UnistylesValues | ((...args: Array<any>) => UnistylesValues), _variants: Record<string, any>, _args?: Array<any>) => {
        if (ref === null) {
            // Remove style tags from the document
            const { __uni__refs } = extractSecrets(_style)

            __uni__refs.forEach(ref => {
                if (isInDocument(ref)) {
                    return
                }

                this.remove(ref, _style)
            })

            return
        }

        if (!(ref instanceof HTMLElement)) {
            return
        }

        const { __uni__key, __uni__stylesheet, __uni__refs, __uni__args = [], __uni__variants = {} } = extractSecrets(_style)

        const newComputedStylesheet = typeof __uni__stylesheet === 'function'
            ? __uni__stylesheet(UnistylesRuntime.theme, UnistylesRuntime.miniRuntime)
            : __uni__stylesheet
        const style = newComputedStylesheet[__uni__key]
        const args = _args ?? __uni__args
        const resultHidden = typeof style === 'function'
            ? style(...args)
            : style
        const result = extractHiddenProperties(resultHidden)
        const { variants } = Object.fromEntries(getVariants({ variants: result }, __uni__variants))
        const resultWithVariants = {
            ...result,
            ...variants
        }
        const storedWebUnistyle = this.webUnistylesMap.get(ref, __uni__key)
        const webUnistyle = storedWebUnistyle ?? UnistylesRegistry.createStyles(resultWithVariants, __uni__key)

        this.webUnistylesMap.set(ref, __uni__key, webUnistyle)
        this.disposeMap.get(ref, __uni__key)?.()
        this.disposeMap.set(ref, __uni__key, listenToDependencies({
            key: __uni__key,
            stylesheet: __uni__stylesheet,
            args,
            className: webUnistyle.className,
            unistyles: webUnistyle.unistyles,
        }))

        if (!storedWebUnistyle) {
            const styleTag = document.createElement('style')

            ref.classList.add(webUnistyle.className)
            webUnistyle.unistyles.setStylesTarget(styleTag)
            document.head.appendChild(styleTag)
            __uni__refs.add(ref)
            this.stylesMap.set(ref, __uni__key, styleTag)
        }

        if (storedWebUnistyle) {
            UnistylesRegistry.updateStyles(webUnistyle.unistyles, resultWithVariants, webUnistyle.className)
        }
    }

    remove = (ref: HTMLElement, style: UnistylesValues | ((...args: Array<any>) => UnistylesValues)) => {
        const { __uni__key } = extractSecrets(style)

        this.webUnistylesMap.delete(ref, __uni__key)
        this.disposeMap.get(ref, __uni__key)?.()
        this.disposeMap.delete(ref, __uni__key)
        this.stylesMap.get(ref, __uni__key)?.remove()
        this.stylesMap.delete(ref, __uni__key)
    }
}

export const UnistylesShadowRegistry = new UnistylesShadowRegistryBuilder()
