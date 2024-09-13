#if os(iOS)

import Foundation
import NitroModules

typealias CxxListener = (Array<UnistyleDependency>) -> Void

class NativeIOSPlatform: HybridNativePlatformSpec {
    var listeners: Array<CxxListener> = []
    var miniRuntime: UnistylesNativeMiniRuntime?
    var hybridContext = margelo.nitro.HybridContext()
    var memorySize: Int {
        return getSizeOf(self)
    }

    init() {
        setupPlatformListeners()

        self.miniRuntime = UnistylesNativeMiniRuntime(
            colorScheme: try! self.getColorScheme(),
            screen: try! self.getScreenDimensions(),
            contentSizeCategory: try! self.getContentSizeCategory(),
            insets: try! self.getInsets(),
            pixelRatio: try! self.getPixelRatio(),
            fontScale: try! self.getFontScale(),
            rtl: try! self.getPrefersRtlDirection(),
            statusBar: try! self.getStatusBarDimensions(),
            navigationBar: try! self.getNavigationBarDimensions()
        )
    }

    deinit {
        removePlatformListeners()
    }

    func buildMiniRuntime() throws -> UnistylesNativeMiniRuntime {
        return self.miniRuntime!
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
        DispatchQueue.main.sync {
            let contentSizeCategory = UIApplication.shared.preferredContentSizeCategory
            let defaultMultiplier: CGFloat = 17.0

            switch contentSizeCategory {
            case .extraExtraExtraLarge:
                return 23.0 / defaultMultiplier
            case .extraExtraLarge:
                return 21.0 / defaultMultiplier
            case .extraLarge:
                return 19.0 / defaultMultiplier
            case .large:
                return 17.0 / defaultMultiplier
            case .medium:
                return 16.0 / defaultMultiplier
            case .small:
                return 15.0 / defaultMultiplier
            case .extraSmall:
                return 14.0 / defaultMultiplier
            case .accessibilityMedium:
                return 29.0 / defaultMultiplier
            case .accessibilityLarge:
                return 33.0 / defaultMultiplier
            case .accessibilityExtraLarge:
                return 40.0 / defaultMultiplier
            case .accessibilityExtraExtraLarge:
                return 47.0 / defaultMultiplier
            case .accessibilityExtraExtraExtraLarge:
                return 53.0 / defaultMultiplier
            default:
                return 1.0
            }
        }
    }

    func getScreenDimensions() throws -> Dimensions {
        // todo: fix this
        func getDimensions() -> Dimensions {
            guard let presentedViewController = RCTPresentedViewController(),
                  let windowFrame = presentedViewController.view.window?.frame else {
                // this should never happen, but it's better to return zeros
                return Dimensions(width: 0, height: 0)
            }

            let width = windowFrame.size.width
            let height = windowFrame.size.height

            return Dimensions(width: width, height: height)
        }

        if Thread.isMainThread {
            return getDimensions()
        }

        return DispatchQueue.main.sync {
            return getDimensions()
        }
    }

    func getContentSizeCategory() throws -> String {
        DispatchQueue.main.sync {
            let contentSizeCategory = UIApplication.shared.preferredContentSizeCategory

            switch contentSizeCategory {
            case .extraExtraExtraLarge:
                return "xxxLarge"
            case .extraExtraLarge:
                return "xxLarge"
            case .extraLarge:
                return "xLarge"
            case .large:
                return "Large"
            case .medium:
                return "Medium"
            case .small:
                return "Small"
            case .extraSmall:
                return "xSmall"
            case .accessibilityMedium:
                return "accessibilityMedium"
            case .accessibilityLarge:
                return "accessibilityLarge"
            case .accessibilityExtraLarge:
                return "accessibilityExtraLarge"
            case .accessibilityExtraExtraLarge:
                return "accessibilityExtraExtraLarge"
            case .accessibilityExtraExtraExtraLarge:
                return "accessibilityExtraExtraExtraLarge"
            default:
                return "unspecified"
            }
        }
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

    func getPrefersRtlDirection() throws -> Bool {
        DispatchQueue.main.sync {
            let hasForcedRtl = UserDefaults.standard.bool(forKey: "RCTI18nUtil_forceRTL")
            let isRtl = UIApplication.shared.userInterfaceLayoutDirection == .rightToLeft

            return hasForcedRtl || isRtl
        }
    }

    func getStatusBarDimensions() throws -> Dimensions {
        DispatchQueue.main.sync {
            guard let window = UIApplication.shared.windows.first,
                  let statusBarManager = window.windowScene?.statusBarManager else {
                // this should never happen, but it's better to return defaults
                return Dimensions(width: 0, height: 0)
            }

            let statusBarSize = statusBarManager.statusBarFrame.size

            return Dimensions(width: statusBarSize.width, height: statusBarSize.height)
        }
    }

    func getPixelRatio() throws -> Double {
        DispatchQueue.main.sync {
            guard let presentedViewController = RCTPresentedViewController(),
                  let window = presentedViewController.view.window else {
                // this should never happen, but it's better to return default
                return 1;
            }

            return window.screen.scale
        }
    }

    func setRootViewBackgroundColor(color: Double?) throws {
        DispatchQueue.main.async {
            guard let presentedViewController = RCTPresentedViewController() else {
                print("🦄 Unistyles: Couldn't set rootView backgroundColor")

                return
            }
            // todo convert int to UIColor
            // presentedViewController.view.backgroundColor = color
        }
    }

    func getNavigationBarDimensions() throws -> Dimensions {
        return Dimensions(width: 0, height: 0);
    }

    // not implemented for iOS as there are no such APIs
    func setNavigationBarBackgroundColor(color: Double?) throws {}
    func setNavigationBarHidden(isHidden: Bool) throws {}
    func setStatusBarBackgroundColor(color: Double?) throws {}

    // implemented from JS
    func setImmersiveMode(isEnabled: Bool) throws {}
}

#endif
