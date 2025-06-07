import React, { useLayoutEffect } from 'react'
import type { PropsWithChildren } from 'react'
import type { UnistylesThemes } from '../global'
import { ApplyScopedTheme } from './ApplyScopedTheme'
import { UnistylesShadowRegistry } from '../specs'

interface NamedThemeProps extends PropsWithChildren {
    name: keyof UnistylesThemes,
    previousScopedTheme?: string
}

export const NamedTheme: React.FunctionComponent<NamedThemeProps> = ({
    name,
    children,
    previousScopedTheme
}) => {
    const mappedChildren = [
        <ApplyScopedTheme key={name} name={name} />,
        children,
        <ApplyScopedTheme key='dispose' name={previousScopedTheme as keyof UnistylesThemes | undefined} />
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
