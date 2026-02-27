import * as unistyles from '../web/services'
import { error, isServer } from '../web/utils'

export const resetServerUnistyles = () => {
    if (!isServer()) {
        throw error('Server styles should only be reset on the server')
    }

    unistyles.services.registry.reset()
}
