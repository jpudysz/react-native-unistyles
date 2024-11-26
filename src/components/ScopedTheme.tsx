import React, { useLayoutEffect } from 'react'
import type { UnistylesThemes } from '../global'
import { UnistylesShadowRegistry } from '../specs'

type ThemeProps = {
    name: keyof UnistylesThemes
}

const Apply = ({ name }: { name?: keyof UnistylesThemes }) => {
    // @ts-expect-error this is hidden from TS
    UnistylesShadowRegistry.setScopedTheme(name)

    useLayoutEffect(() => {
        // @ts-expect-error this is hidden from TS
        UnistylesShadowRegistry.setScopedTheme(name)
    })

    return null
}

export const ScopedTheme: React.FunctionComponent<React.PropsWithChildren<ThemeProps>> = ({ name, children}) => {
    const childrens = [
        <Apply key={name} name={name} />,
        children,
        <Apply key='dispose' />
    ]

    return <React.Fragment>{childrens}</React.Fragment>
}
