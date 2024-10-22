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
        cancellables.removeAll()
    }

    func registerPlatformListener(callback: @escaping (CxxListener)) throws {
        listeners.append(callback)
    }

    func emitCxxEvent(dependencies: Array<UnistyleDependency>) {
        self.listeners.forEach { $0(dependencies) }
    }

    @objc func onWindowChange(_ notification: Notification) {
        // add small delay (10ms) to make sure all values are up ot date
        guard let currentMiniRuntime = self.miniRuntime else {
            return
        }
        
        let newMiniRuntime = self.buildMiniRuntime()
        let changedDependencies = UnistylesNativeMiniRuntime.diff(lhs: currentMiniRuntime, rhs: newMiniRuntime)

        if (changedDependencies.count > 0) {
            self.miniRuntime = newMiniRuntime
            self.emitCxxEvent(dependencies: changedDependencies)
        }
    }
}
