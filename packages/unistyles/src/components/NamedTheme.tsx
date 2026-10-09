import type { PropsWithChildren } from 'react'

import React, { useLayoutEffect, useMemo } from 'react'

import type { UnistylesThemes } from '../global'

import { UnistylesShadowRegistry } from '../specs'
import { ApplyScopedTheme } from './ApplyScopedTheme'
import { scopeChildren } from './scopeChildren'
import { ScopedThemeContext } from './ScopedThemeContext'

interface NamedThemeProps extends PropsWithChildren {
    name: keyof UnistylesThemes | undefined
    previousScopedTheme?: string
}

export const NamedTheme: React.FunctionComponent<NamedThemeProps> = ({ name, children, previousScopedTheme }) => {
    const scope = useMemo(() => ({ name }), [name])

    const mappedChildren = [
        <ApplyScopedTheme key="apply" name={name} />,
        <ScopedThemeContext.Provider key="scope" value={scope}>
            {scopeChildren(name, children)}
        </ScopedThemeContext.Provider>,
        <ApplyScopedTheme key="dispose" name={previousScopedTheme as keyof UnistylesThemes | undefined} />,
    ]

    useLayoutEffect(() => {
        // this will affect only scoped styles as other styles are not yet mounted
        UnistylesShadowRegistry.flush()
    })

    return <React.Fragment>{mappedChildren}</React.Fragment>
}
