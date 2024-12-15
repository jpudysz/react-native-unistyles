import React, { useLayoutEffect } from 'react'
import { UnistylesShadowRegistry } from '../specs'

type VariantProps = {
    variants?: Record<string, string | boolean | undefined>
}

const Apply: React.FunctionComponent<VariantProps> = ({ variants }) => {
    UnistylesShadowRegistry.selectVariants(variants)

    useLayoutEffect(() => {
        UnistylesShadowRegistry.selectVariants(variants)
    })

    return null
}
export const Variants: React.FunctionComponent<React.PropsWithChildren<VariantProps>> = ({ variants, children }) => {
    const previousScopedVariants = UnistylesShadowRegistry.getVariants()
    const mappedChildren = [
        <Apply key='add' variants={variants} />,
        children,
        <Apply key='remove' variants={previousScopedVariants} />
    ]

    return (
        <React.Fragment>
            {mappedChildren}
        </React.Fragment>
    )
}
