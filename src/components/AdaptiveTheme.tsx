import React, { useLayoutEffect } from 'react'
import type { PropsWithChildren } from 'react'
import { useUnistyles } from '../core'
import { ApplyScopedTheme } from './ApplyScopedTheme'
import type { UnistylesThemes } from '../global'
import { UnistylesShadowRegistry } from '../specs'

interface AdaptiveThemeProps extends PropsWithChildren {
    previousScopedTheme?: string
}

export const AdaptiveTheme: React.FunctionComponent<AdaptiveThemeProps> = ({
    children,
    previousScopedTheme
}) => {
    const { rt } = useUnistyles()
    const name = (rt.themeName === 'dark' ? 'light' : 'dark') as keyof UnistylesThemes
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
        <React.Fragment key={name}>
            {mappedChildren}
        </React.Fragment>
    )
}
