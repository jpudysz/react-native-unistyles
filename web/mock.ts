import type { NavigationBar as NavigationBarSpec } from '../src/specs/NavigtionBar'
import type { StatusBar as StatusBarSpec } from '../src/specs/StatusBar'

export const StatusBar: StatusBarSpec = {
    width: 0,
    height: 0,
    setStyle: () => {},
    setHidden: () => {},
    setBackgroundColor: () => {},
    equals: () => true,
    toString: () => 'StatusBar',
    __type: 'web',
    name: 'StatusBar'
}

export const NavigationBar: NavigationBarSpec = {
    width: 0,
    height: 0,
    setHidden: () => {},
    setBackgroundColor: () => {},
    equals: () => true,
    toString: () => 'NavigationBar',
    __type: 'web',
    name: 'NavigationBar'
}
