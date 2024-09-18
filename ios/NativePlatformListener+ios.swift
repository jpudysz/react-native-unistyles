import Foundation

extension NativeIOSPlatform {
    func setupPlatformListeners() {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(onWindowChange(_:)),
            name: NSNotification.Name("RCTWindowFrameDidChangeNotification"),
            object: nil
        )
    }

    func removePlatformListeners() {
        NotificationCenter.default.removeObserver(self, name: NSNotification.Name("RCTWindowFrameDidChangeNotification"), object: nil)
    }

    func registerPlatformListener(callback: @escaping (CxxListener)) throws {
        listeners.append(callback)
    }

    func emitCxxEvent(dependencies: Array<UnistyleDependency>) {
        self.listeners.forEach { $0(dependencies) }
    }

    @objc func onWindowChange(_ notification: Notification) {
        do {
            let newMiniRuntime = try self.buildMiniRuntime()
            let platformEvents = UnistylesNativeMiniRuntime.diff(lhs: self.miniRuntime, rhs: newMiniRuntime)

            if (platformEvents.count > 0) {
                self.miniRuntime = newMiniRuntime
            }

            self.emitCxxEvent(dependencies: platformEvents)
        } catch {}
    }
}
