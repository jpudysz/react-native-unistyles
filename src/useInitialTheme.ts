import { useRef } from 'react'
import { UnistylesRuntime } from './CxxUnistyles'

export const useInitialTheme = (forName: string) => {
    useRef(UnistylesRuntime.useTheme(forName))
}
