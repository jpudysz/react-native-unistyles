import type { UnistylesValues } from '../types'
import { listenToDependencies } from './listener'
import { UnistylesRegistry } from './registry'
import { extractSecrets } from './utils'
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

    private readonly webUnistylesByRef = new Map<HTMLElement, WebUnistyle>()
    private readonly disposeByRef = new Map<HTMLElement, VoidFunction | undefined>()

    add = (ref: HTMLElement | null, style: UnistylesValues | ((...args: Array<any>) => UnistylesValues), uni_variants: Record<string, any> = {}, args: Array<any> = []) => {
        if (!ref) {
            return
        }

        const { key, stylesheet } = extractSecrets(style)
        const result = typeof style === 'function'
            ? style(...args)
            : style
        const { variants } = Object.fromEntries(getVariants({ variants: result }, uni_variants))
        const resultWithVariants = {
            ...result,
            ...variants
        }
        const storedWebUnistyle = this.webUnistylesByRef.get(ref)
        const webUnistyle = storedWebUnistyle ?? UnistylesRegistry.createStyles(resultWithVariants, key)

        this.webUnistylesByRef.set(ref, webUnistyle)
        this.disposeByRef.get(ref)?.()
        this.disposeByRef.set(ref, listenToDependencies({
            key,
            stylesheet,
            args,
            className: webUnistyle.className,
            unistyles: webUnistyle.unistyles,
        }))
        ref.classList.add(webUnistyle.className)

        if (storedWebUnistyle) {
            UnistylesRegistry.updateStyles(webUnistyle.unistyles, resultWithVariants, webUnistyle.className)
        }
    }

    remove = () => {}
}

export const UnistylesShadowRegistry = new UnistylesShadowRegistryBuilder()
