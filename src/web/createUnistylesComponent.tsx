import React, { useEffect, useState } from 'react'
import { extractHiddenProperties, extractSecrets } from './utils'
import { getVariants } from './variants'
import { UnistylesListener } from './listener'
import { UnistylesRegistry } from './registry'

const getStyles = (value: Record<string, any>) => {
    const secrets = extractSecrets(value)

    if (secrets.length === 0) {
        return undefined
    }

    return secrets.reduce((acc, { __uni__stylesheet, __uni__key, __uni__args = [], __uni__variants }) => {
        const newComputedStylesheet = UnistylesRegistry.getComputedStylesheet(__uni__stylesheet)
        const style = newComputedStylesheet[__uni__key]
        const resultHidden = typeof style === 'function'
            ? style(...__uni__args)
            : style
        const result = extractHiddenProperties(resultHidden)
        const { variants } = Object.fromEntries(getVariants({ variants: result }, __uni__variants ))
        const resultWithVariants = {
            ...result,
            ...variants
        }

        return {
            ...acc,
            ...resultWithVariants
        }
    }, {} as Record<string, any>)
}

export const createUnistylesComponent = <TProps extends object>(Component: React.ComponentType<TProps>) => (props: TProps) => {
    const passedStyles = (props as TProps & { style: Record<string, any> }).style ?? {}
    const [style, setStyle] = useState(getStyles(passedStyles))

    useEffect(() => {
        const newStyles = getStyles(passedStyles)
        const dependencies = newStyles?.['uni__dependencies'] ?? []
        const dispose = UnistylesListener.addListeners(dependencies, () => setStyle(getStyles(passedStyles)))

        setStyle(newStyles)

        return dispose
    }, [passedStyles])

    return (
        <Component
            {...props}
            style={style}
        />
    )
}
