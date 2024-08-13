import type { StatusBar as StatusBarSpec } from './StatusBar.nitro'
import type { StatusBarStyle } from '../types'

export interface StatusBar extends StatusBarSpec {
    setStyle(style: StatusBarStyle): void
    setBackgroundColor(hex?: `#${string}`, alpha?: number): void
}
