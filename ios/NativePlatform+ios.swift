#if os(iOS)

import Foundation
import NitroModules

class NativeIOSPlatform: HybridNativePlatformSpec {
    var hybridContext = margelo.nitro.HybridContext()

    var memorySize: Int {
        return getSizeOf(self)
    }

    func getColorScheme() throws -> ColorScheme {
        let interfaceStyle = UIScreen.main.traitCollection.userInterfaceStyle
        
        switch (interfaceStyle) {
        case .dark:
            return ColorScheme.dark
        case .light:
            return ColorScheme.light
        case .unspecified:
            return ColorScheme.unspecified
        default:
            return ColorScheme.unspecified
        }
    }

    func getFontScale() throws -> Double {
        return 1.0
    }

    func getContentSizeCategory() throws -> String {
        return "unspecified"
    }

    // todo handle IME animation
    func getInsets() throws -> Insets {
        DispatchQueue.main.sync {
            guard let window = UIApplication.shared.windows.first else {
                // this should never happen, but it's better to return zeros
                return Insets(top: 0, bottom: 0, left: 0, right: 0, ime: 0)
            }

            let safeArea = window.safeAreaInsets

            return Insets(top: safeArea.top, bottom: safeArea.bottom, left: safeArea.left, right: safeArea.right, ime: 0)
        }
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
