import type React from 'react'

import type { UnistylesThemes } from '../global'

export const scopeChildren = (_name: keyof UnistylesThemes | undefined, children: React.ReactNode) => children
