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
        // add small delay (10ms) to make sure all values are up ot date
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.01) {
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
}
