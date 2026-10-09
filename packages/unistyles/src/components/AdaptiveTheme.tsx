import type { PropsWithChildren } from 'react'

import React, { useLayoutEffect, useMemo } from 'react'

import type { UnistylesThemes } from '../global'

import { useUnistyles } from '../core'
import { UnistylesShadowRegistry } from '../specs'
import { ApplyScopedTheme } from './ApplyScopedTheme'
import { scopeChildren } from './scopeChildren'
import { ScopedThemeContext } from './ScopedThemeContext'

interface AdaptiveThemeProps extends PropsWithChildren {
    previousScopedTheme?: string
}

export const AdaptiveTheme: React.FunctionComponent<AdaptiveThemeProps> = ({ children, previousScopedTheme }) => {
    const { rt } = useUnistyles()
    const name = (rt.colorScheme === 'dark' ? 'light' : 'dark') as keyof UnistylesThemes
    const scope = useMemo(() => ({ name }), [name])

    const mappedChildren = [
        <ApplyScopedTheme key={name} name={name} />,
        <ScopedThemeContext.Provider key="scope" value={scope}>
            {scopeChildren(name, children)}
        </ScopedThemeContext.Provider>,
        <ApplyScopedTheme key="dispose" name={previousScopedTheme as keyof UnistylesThemes | undefined} />,
    ]

    useLayoutEffect(() => {
        // this will affect only scoped styles as other styles are not yet mounted
        UnistylesShadowRegistry.flush()
    })

    return <React.Fragment key={name}>{mappedChildren}</React.Fragment>
}
