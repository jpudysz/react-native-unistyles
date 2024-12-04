import React, { useLayoutEffect } from 'react'
import { UnistylesShadowRegistry } from '../specs'

type VariantProps = {
    variants?: Record<string, string | undefined>
}

const Apply: React.FunctionComponent<VariantProps> = ({ variants }) => {
    // @ts-expect-error this is hidden from TS
    UnistylesShadowRegistry.selectVariants(variants)
    useLayoutEffect(() => {
        // @ts-expect-error this is hidden from TS
        UnistylesShadowRegistry.selectVariants(variants)
    })
    return null
}
export const Variants: React.FunctionComponent<React.PropsWithChildren<VariantProps>> = ({ variants, children}) => {
    const childrens = [
        <Apply key='add' variants={variants} />,
        children,
        <Apply key='remove' />
    ]
    return <React.Fragment>{childrens}</React.Fragment>
}
