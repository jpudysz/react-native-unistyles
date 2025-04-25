import Foundation
import Combine

extension NativeIOSPlatform {
    func setupPlatformListeners() {
        let windowPublisher = NotificationCenter.default.publisher(for: NSNotification.Name("RCTWindowFrameDidChangeNotification"))
        let orientationPublisher = NotificationCenter.default.publisher(for: UIDevice.orientationDidChangeNotification)
        let colorSchemePublisher = NotificationCenter.default.publisher(for: NSNotification.Name("RCTUserInterfaceStyleDidChangeNotification"))

        Publishers
            .MergeMany([windowPublisher, orientationPublisher, colorSchemePublisher])
            .throttle(for: .milliseconds(25), scheduler: RunLoop.main, latest: true)
            .sink { [weak self] _ in
                self?.onNativePlatformChange()
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

    @objc func onNativePlatformChange() {
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
