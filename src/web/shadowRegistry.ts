import type { UnistylesValues } from '../types'
import { listenToDependencies } from './listener'
import { UnistylesRegistry } from './registry'
import { UnistylesRuntime } from './runtime'
import { createDoubleMap, extractHiddenProperties, extractSecrets, isInDocument } from './utils'
import { getVariants } from './variants'

type WebUnistyle = ReturnType<typeof UnistylesRegistry.createStyles>

type Style = UnistylesValues | ((...args: Array<any>) => UnistylesValues)

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

    add = (ref: any, _style?: Style | Array<Style>, _variants?: Record<string, any>, _args?: Array<any>) => {
        // Style is not provided
        if (!_style) {
            return
        }

        // Array of styles
        if (Array.isArray(_style)) {
            _style.forEach(style => this.add(ref, style, _variants, _args))

            return
        }

        // Not a unistyle
        if (!Object.keys(_style).some(key => key.startsWith('__uni__'))) {
            return
        }

        // Ref is unmounted, remove style tags from the document
        if (ref === null) {
            const secrets = extractSecrets(_style)

            secrets.forEach(({ __uni__refs }) => {
                __uni__refs.forEach(ref => {
                    if (isInDocument(ref)) {
                        return
                    }

                    this.remove(ref, _style)
                })
            })

            return
        }

        // Ref is not an HTMLElement
        if (!(ref instanceof HTMLElement)) {
            return
        }

        extractSecrets(_style).forEach(secret => {
            const { __uni__key, __uni__stylesheet, __uni__refs, __uni__variants, __uni__args = [] } = secret
            const newComputedStylesheet = typeof __uni__stylesheet === 'function'
                ? __uni__stylesheet(UnistylesRuntime.theme, UnistylesRuntime.miniRuntime)
                : __uni__stylesheet
            const style = newComputedStylesheet[__uni__key]
            const args = _args ?? __uni__args
            const resultHidden = typeof style === 'function'
                ? style(...args)
                : style
            const result = extractHiddenProperties(resultHidden)
            const { variants } = Object.fromEntries(getVariants({ variants: result }, _variants && Object.keys(_variants).length > 0 ? _variants : __uni__variants))
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

                const additionalClasses = resultWithVariants?._web?._classNames

                if (additionalClasses) {
                    ref.classList.add(...Array.isArray(additionalClasses) ? additionalClasses : [additionalClasses])
                }

                ref.classList.add(webUnistyle.className)
                webUnistyle.unistyles.setStylesTarget(styleTag)
                document.head.appendChild(styleTag)
                __uni__refs.add(ref)
                this.stylesMap.set(ref, __uni__key, styleTag)
            }

            if (storedWebUnistyle) {
                UnistylesRegistry.updateStyles(webUnistyle.unistyles, resultWithVariants, webUnistyle.className)
            }
        })
    }

    remove = (ref: HTMLElement, style: Style) => {
        extractSecrets(style).forEach(({ __uni__key }) => {
            this.webUnistylesMap.delete(ref, __uni__key)
            this.disposeMap.get(ref, __uni__key)?.()
            this.disposeMap.delete(ref, __uni__key)
            this.stylesMap.get(ref, __uni__key)?.remove()
            this.stylesMap.delete(ref, __uni__key)
        })
    }
}

export const UnistylesShadowRegistry = new UnistylesShadowRegistryBuilder()
