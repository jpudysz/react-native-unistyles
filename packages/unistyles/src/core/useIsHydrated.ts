import { useSyncExternalStore } from 'react'

const subscribe = () => () => {}
const getIsHydrated = () => true
const getIsHydratedOnServer = () => false

// False while rendering on the server and while React hydrates the server's HTML, true afterwards. Always true in the
// native apps, which don't hydrate. React renders again right after hydrating, with `true`
export const useIsHydrated = () => useSyncExternalStore(subscribe, getIsHydrated, getIsHydratedOnServer)
