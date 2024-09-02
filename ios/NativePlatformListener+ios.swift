import Foundation

extension NativeIOSPlatform {
    func setupPlatformListeners() {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(onWindowChange(_:)),
            name: NSNotification.Name("RCTWindowFrameDidChangeNotification"),
            object: nil
        )
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(onAppearanceChange(_:)),
            name: NSNotification.Name("RCTUserInterfaceStyleDidChangeNotification"),
            object: nil
        )
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(onContentSizeCategoryChange(_:)),
            name: UIContentSizeCategory.didChangeNotification,
            object: nil
        )
    }
    
    func removePlatformListeners() {
        NotificationCenter.default.removeObserver(self, name: UIContentSizeCategory.didChangeNotification, object: nil)
        NotificationCenter.default.removeObserver(self, name: NSNotification.Name("RCTWindowFrameDidChangeNotification"), object: nil)
        NotificationCenter.default.removeObserver(self, name: NSNotification.Name("RCTUserInterfaceStyleDidChangeNotification"), object: nil)
    }
    
    func registerPlatformListener(callback: @escaping (CxxListener)) throws {
        listeners.append(callback)
    }
    
    func emitCxxEvent(event: PlatformEvent) {
        self.listeners.forEach { $0(event) }
    }
    
    @objc func onWindowChange(_ notification: Notification) {
        self.emitCxxEvent(event: PlatformEvent.onscreensizechange)
    }

    @objc func onAppearanceChange(_ notification: Notification) {
        // todo
    }

    @objc func onContentSizeCategoryChange(_ notification: Notification) {
        // todo
    }
}
