import type { NavigationBar as NavigationBarSpec } from './NavigationBar.nitro'

export interface NavigationBar extends NavigationBarSpec {
    setBackgroundColor(hex?: `#${string}`, alpha?: number): void
}
