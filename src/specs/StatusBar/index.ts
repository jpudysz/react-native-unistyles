import type { StatusBar as StatusBarSpec } from './StatusBar.nitro'
import type { StatusBarStyle } from '../types'

export type StatusBarHiddenAnimation = 'none' | 'fade' | 'slide'

export interface StatusBar extends StatusBarSpec {
    setStyle(style: StatusBarStyle, animated?: boolean): void,
    setHidden(isHidden: boolean, animation?: StatusBarHiddenAnimation): void,
    setBackgroundColor(hex?: `#${string}`, alpha?: number): void
}
