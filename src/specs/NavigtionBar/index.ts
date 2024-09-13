import type { UnistylesNavigationBar as UnistylesNavigationBarSpec } from './UnistylesNavigationBar.nitro'

export interface UnistylesNavigationBar extends Omit<UnistylesNavigationBarSpec, 'setBackgroundColor' | 'dispose'> {
    setBackgroundColor(color?: string): void
}
