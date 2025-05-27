import React, { useLayoutEffect } from 'react'
import type { UnistylesThemes } from '../global'
import { UnistylesShadowRegistry } from '../specs'

type ThemeProps = {
    name: keyof UnistylesThemes
}

const Apply = ({ name }: { name?: keyof UnistylesThemes }) => {
    UnistylesShadowRegistry.setScopedTheme(name)

    useLayoutEffect(() => {
        UnistylesShadowRegistry.setScopedTheme(name)
    })

    return null
}

export const ScopedTheme: React.FunctionComponent<React.PropsWithChildren<ThemeProps>> = ({ name, children }) => {
    const previousScopedTheme = UnistylesShadowRegistry.getScopedTheme()
    const mappedChildren = [
        <Apply key={name} name={name} />,
        children,
        <Apply key='dispose' name={previousScopedTheme as keyof UnistylesThemes | undefined} />
    ]

    useLayoutEffect(() => {
        // this will affect only scoped styles as other styles are not yet mounted
        UnistylesShadowRegistry.flush()
    })

    return (
        <React.Fragment>
            {mappedChildren}
        </React.Fragment>
    )
}
