import Foundation

extension NativeIOSPlatform {
    func setupPlatformListeners() {
        NotificationCenter.default.publisher(for: NSNotification.Name("RCTWindowFrameDidChangeNotification"))
            // add small delay (10ms) to make sure all values are up ot date
            // we MUST call it on current thread, otherwise random crashes occurs
            .delay(for: .milliseconds(10), scheduler: RunLoop.current)
            .sink { [weak self] notification in
                self?.onWindowChange(notification)
            }
            .store(in: &cancellables)
    }

    func removePlatformListeners() {
        self.unregisterPlatformListeners()
    }

    func registerPlatformListener(callback: @escaping (CxxDependencyListener)) throws {
        self.dependencyListeners.append(callback)
    }

    func registerImeListener(callback: @escaping ((UnistylesNativeMiniRuntime) -> Void)) throws {
        self.imeListeners.append(callback)
    }

    func emitCxxEvent(dependencies: Array<UnistyleDependency>, updatedMiniRuntime: UnistylesNativeMiniRuntime) {
        self.dependencyListeners.forEach { $0(dependencies, updatedMiniRuntime) }
    }

    func emitImeEvent(updatedMiniRuntime: UnistylesNativeMiniRuntime) {
        self.imeListeners.forEach { $0(updatedMiniRuntime) }
    }
    
    func unregisterPlatformListeners() {
        cancellables.removeAll()
        dependencyListeners.removeAll()
        imeListeners.removeAll()
    }

    @objc func onWindowChange(_ notification: Notification) {
        guard let currentMiniRuntime = self.miniRuntime else {
            return
        }

        let newMiniRuntime = self.buildMiniRuntime()
        let changedDependencies = UnistylesNativeMiniRuntime.diff(lhs: currentMiniRuntime, rhs: newMiniRuntime)

        if (changedDependencies.count > 0) {
            self.miniRuntime = newMiniRuntime
            self.emitCxxEvent(dependencies: changedDependencies, updatedMiniRuntime: newMiniRuntime)
        }
    }
}
