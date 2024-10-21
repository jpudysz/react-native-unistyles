import { UnistyleDependency } from '../specs/NativePlatform'
import { UnistylesRuntime } from './runtime'

class UnistylesListenerBuilder {
    private isInitialized = false
    private listeners = Array.from({ length: Object.keys(UnistyleDependency).length / 2 }, () => new Set<VoidFunction>())

    emitChange = (dependency: UnistyleDependency) => {
        this.listeners[dependency]?.forEach(listener => listener())
    }

    initListeners = () => {
        if (this.isInitialized) {
            return
        }

        this.isInitialized = true
        UnistylesRuntime.darkMedia?.addEventListener('change', () => this.emitChange(UnistyleDependency.ColorScheme))
        UnistylesRuntime.lightMedia?.addEventListener('change', () => this.emitChange(UnistyleDependency.ColorScheme))
        window.addEventListener('orientationchange', () => this.emitChange(UnistyleDependency.Orientation))
        window.addEventListener('resize', () => this.emitChange(UnistyleDependency.Dimensions))
    }

    addListeners = (dependencies: Array<UnistyleDependency>, listener: VoidFunction) => {
        dependencies.forEach(dependency => this.listeners[dependency]?.add(listener))

        return () => {
            dependencies.forEach(dependency => this.listeners[dependency]?.delete(listener))
        }
    }
}

export const UnistylesListener = new UnistylesListenerBuilder()
