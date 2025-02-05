import { UnistylesWeb } from '../web'
import { error, isServer } from '../web/utils'

declare global {
    interface Window {
        // @ts-ignore
        __UNISTYLES_STATE__: ReturnType<typeof UnistylesWeb.registry.css.getState>
    }
}

export const hydrateServerUnistyles = () => {
    if (isServer()) {
        throw error('Server styles should only be hydrated on the client')
    }
    UnistylesWeb.registry.css.hydrate(window.__UNISTYLES_STATE__)
    document.querySelector('#unistyles-script')?.remove()
}
