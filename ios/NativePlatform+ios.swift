#if os(iOS)

import Foundation
import NitroModules

class NativeIOSPlatform: HybridNativePlatformSpec {
    var hybridContext = margelo.nitro.HybridContext()
    
    var memorySize: Int {
        return getSizeOf(self)
    }
    
    func getColorScheme() throws -> String {
        return "dark"
    }
    
    func getFontScale() throws -> Double {
        return 1.0
    }
    
    func getContentSizeCategory() throws -> String {
        return "unspecified"
    }
    
    func setRootViewBackgroundColor(hex: String?, alpha: Double?) throws {
        //todo
    }
    
    func setNavigationBarBackgroundColor(hex: String?, alpha: Double?) throws {
        // todo
    }
    
    func setNavigationBarHidden(isHidden: Bool) throws {
        // todo
    }
    
    func setStatusBarStyle(style: margelo.nitro.unistyles.StatusBarStyle) throws {
        // todo
    }
    
    func setStatusBarHidden(isHidden: Bool) throws {
        // todo
    }
    
    func setStatusBarBackgroundColor(hex: String?, alpha: Double?) throws {
        // todo
    }
    
    func setImmersiveMode(isEnabled: Bool) throws {
        // todo
    }
}

#endif
