import React from 'react'

import type { UnistylesThemes } from '../global'

import { services } from '../web/services'

export const scopeChildren = (name: keyof UnistylesThemes | undefined, children: React.ReactNode) => {
    if (!services.state.CSSVars) {
        return children
    }

    const scopeProps = name ? { 'data-unistyles-theme': name } : { 'data-unistyles-reset': '' }

    return (
        <div style={{ display: 'contents' }} {...scopeProps}>
            {children}
        </div>
    )
}
