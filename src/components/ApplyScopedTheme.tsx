import { useLayoutEffect } from 'react'

import type { UnistylesThemes } from '../global'

import { UnistylesShadowRegistry } from '../specs'

type ApplyScopedThemeProps = {
    name?: keyof UnistylesThemes
}

export const ApplyScopedTheme: React.FunctionComponent<ApplyScopedThemeProps> = ({ name }) => {
    UnistylesShadowRegistry.setScopedTheme(name)

    useLayoutEffect(() => {
        UnistylesShadowRegistry.setScopedTheme(name)
    })

    return null
}
