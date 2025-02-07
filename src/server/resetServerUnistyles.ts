import { UnistylesWeb } from '../web'
import { error, isServer } from '../web/utils'

export const resetServerUnistyles = () => {
    if (!isServer()) {
        throw error('Server styles should only be reset on the server')
    }
    UnistylesWeb.registry.reset()
}