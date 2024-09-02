import Foundation

extension NativeIOSPlatform {
    func registerPlatformListener(callback: @escaping (CxxListener)) throws {
        listeners.append(callback)
    }
    
    func emitCxxEvent(event: PlatformEvent) {
        self.listeners.forEach { $0(event) }
    }
}
