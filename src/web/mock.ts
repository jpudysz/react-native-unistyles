import type { UnistylesNavigationBar as NavigationBarSpec } from '../specs/NavigtionBar'
import type { UnistylesStatusBar as StatusBarSpec } from '../specs/StatusBar'

export const StatusBar: StatusBarSpec = {
    width: 0,
    height: 0,
    setStyle: () => {},
    setHidden: () => {},
    equals: () => true,
    toString: () => 'StatusBar',
    __type: 'web',
    name: 'StatusBar'
}

export const NavigationBar: NavigationBarSpec = {
    width: 0,
    height: 0,
    setHidden: () => {},
    equals: () => true,
    dispose: () => {},
    toString: () => 'NavigationBar',
    __type: 'web',
    name: 'NavigationBar'
}
