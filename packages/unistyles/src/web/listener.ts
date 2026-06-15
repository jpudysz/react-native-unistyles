import type { UnistylesServices } from './types'

import { UnistyleDependency } from '../specs/NativePlatform'

type Listener = (dependency: UnistyleDependency) => void
type PublicListener = (dependencies: Array<UnistyleDependency>) => void

export class UnistylesListener {
    private isInitialized = false
    private listeners = Array.from({ length: Object.keys(UnistyleDependency).length / 2 }, () => new Set<Listener>())
    private stylesheetListeners = Array.from(
        { length: Object.keys(UnistyleDependency).length / 2 },
        () => new Set<Listener>(),
    )
    private changeListeners = new Set<PublicListener>()

    constructor(private services: UnistylesServices) {}

    emitChanges = (dependencies: Array<UnistyleDependency>) => {
        for (const dependency of dependencies) {
            const stylesheetListeners = this.stylesheetListeners[dependency] ?? []

            for (const listener of stylesheetListeners) {
                listener(dependency)
            }

            const listeners = this.listeners[dependency] ?? []

            for (const listener of listeners) {
                listener(dependency)
            }
        }

        for (const listener of this.changeListeners) {
            listener(dependencies.slice())
        }
    }

    emitChange = (dependency: UnistyleDependency) => {
        this.emitChanges([dependency])
    }

    addChangeListener = (listener: PublicListener) => {
        this.changeListeners.add(listener)

        return () => {
            this.changeListeners.delete(listener)
        }
    }

    reset = () => {
        this.listeners.forEach((listeners) => listeners.clear())
        this.stylesheetListeners.forEach((listeners) => listeners.clear())
        this.changeListeners.clear()
    }

    initListeners = () => {
        if (this.isInitialized) {
            return
        }

        this.isInitialized = true

        this.services.runtime.darkMedia?.addEventListener('change', (event) => {
            if (!event.matches) {
                return
            }

            if (this.services.runtime.hasAdaptiveThemes) {
                this.emitChanges([
                    UnistyleDependency.ColorScheme,
                    UnistyleDependency.Theme,
                    UnistyleDependency.ThemeName,
                ])

                return
            }

            this.emitChange(UnistyleDependency.ColorScheme)
        })
        this.services.runtime.lightMedia?.addEventListener('change', (event) => {
            if (!event.matches) {
                return
            }

            if (this.services.runtime.hasAdaptiveThemes) {
                this.emitChanges([
                    UnistyleDependency.ColorScheme,
                    UnistyleDependency.Theme,
                    UnistyleDependency.ThemeName,
                ])

                return
            }

            this.emitChange(UnistyleDependency.ColorScheme)
        })

        window.addEventListener('orientationchange', () => this.emitChange(UnistyleDependency.Orientation))
        window.addEventListener('resize', () => this.emitChange(UnistyleDependency.Dimensions))
        new MutationObserver(() => {
            this.emitChange(UnistyleDependency.Rtl)
        }).observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['dir'],
        })
    }

    addListeners = (dependencies: Array<UnistyleDependency>, listener: Listener) => {
        dependencies.forEach((dependency) => this.listeners[dependency]?.add(listener))

        return () => {
            dependencies.forEach((dependency) => this.listeners[dependency]?.delete(listener))
        }
    }

    addStylesheetListeners = (dependencies: Array<UnistyleDependency>, listener: Listener) => {
        dependencies.forEach((dependency) => this.stylesheetListeners[dependency]?.add(listener))

        return () => {
            dependencies.forEach((dependency) => this.stylesheetListeners[dependency]?.delete(listener))
        }
    }
}
