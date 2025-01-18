import { error, isServer } from '../web/utils'
import { UnistylesWeb } from '../web'

export const resetServerUnistyles = () => {
    if (!isServer()) {
        throw error('Server styles should only be reset on the server')
    }
    UnistylesWeb.registry.reset()
}