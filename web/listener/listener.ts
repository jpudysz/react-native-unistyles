import { UnistylesRuntime } from '../runtime'
import { UnistyleDependency } from './dependencyList'

export class UnistylesListenerBuilder {
    private listeners = Array.from({ length: Object.keys(UnistyleDependency).length / 2 }, () => new Set<VoidFunction>())

    emitChange = (dependency: UnistyleDependency) => {        
        this.listeners[dependency]?.forEach(listener => listener())
    }

    initListeners = () => {
        UnistylesRuntime.darkMedia?.addEventListener('change', () => this.emitChange(UnistyleDependency.ColorScheme))
        UnistylesRuntime.lightMedia?.addEventListener('change', () => this.emitChange(UnistyleDependency.ColorScheme))
        window.addEventListener('orientationchange', () => this.emitChange(UnistyleDependency.Orientation))
        window.addEventListener('resize', () => this.emitChange(UnistyleDependency.Dimensions))
    }

    addListeners = (dependencies: Array<UnistyleDependency>, listener: VoidFunction) => {
        dependencies.forEach(dependency => this.listeners[dependency]?.add(listener))
    }
}

export const UnistylesListener = new UnistylesListenerBuilder()
