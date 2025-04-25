#if os(iOS)

import Foundation
import Combine
import NitroModules

typealias CxxDependencyListener = (Array<UnistyleDependency>, UnistylesNativeMiniRuntime) -> Void
typealias CxxImeListener = (UnistylesNativeMiniRuntime) -> Void

class NativeIOSPlatform: HybridNativePlatformSpec {
    var miniRuntime: UnistylesNativeMiniRuntime?
    var keyboardAnimation = KeyboardAnimation()
    var cancellables = Set<AnyCancellable>()

    var dependencyListeners: Array<CxxDependencyListener> = []
    var imeListeners: Array<CxxImeListener> = []

    override init() {
        super.init()
        
        self.miniRuntime = self.buildMiniRuntime()

        setupPlatformListeners()
        setupKeyboardListeners()
    }

    deinit {
        removePlatformListeners()
        removeKeyboardListeners()
    }

    func getMiniRuntime() -> UnistylesNativeMiniRuntime {
        return self.miniRuntime!
    }

    func buildMiniRuntime() -> UnistylesNativeMiniRuntime {
        let orientation = self.getOrientation()

        return UnistylesNativeMiniRuntime(
            colorScheme: self.getColorScheme(),
            screen: self.getScreenDimensions(),
            contentSizeCategory: self.getContentSizeCategory(),
            insets: self.getInsets(),
            pixelRatio: self.getPixelRatio(),
            fontScale: self.getFontScale(),
            rtl: self.getPrefersRtlDirection(),
            statusBar: self.getStatusBarDimensions(),
            navigationBar: self.getNavigationBarDimensions(),
            isPortrait: orientation == .portrait,
            isLandscape: orientation == .landscape
        )
    }

    func getColorScheme() -> ColorScheme {
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

    func getFontScale() -> Double {
        func getFontScaleFn() -> Double {
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

        if Thread.isMainThread {
            return getFontScaleFn()
        }

        return DispatchQueue.main.sync {
            return getFontScaleFn()
        }
    }

    func getScreenDimensions() -> Dimensions {
        func getScreenDimensionsFn() -> Dimensions {
            guard let presentedViewController = RCTPresentedViewController(),
                  let windowFrame = presentedViewController.view.window?.frame else {
                
                // when user goes to background RCTPresentedViewController is not available, try to get last known value
                if let cachedRuntime = self.miniRuntime, UIApplication.shared.applicationState == .background {
                    return cachedRuntime.screen;
                }
                
                // this should never happen, but it's better to return zeros
                return Dimensions(width: 0, height: 0)
            }

            let width = windowFrame.size.width
            let height = windowFrame.size.height

            return Dimensions(width: width, height: height)
        }

        if Thread.isMainThread {
            return getScreenDimensionsFn()
        }

        return DispatchQueue.main.sync {
            return getScreenDimensionsFn()
        }
    }

    func getOrientation() -> Orientation {
        let screenDimensions = getScreenDimensions()

        if (screenDimensions.width > screenDimensions.height) {
            return Orientation.landscape
        }

        return Orientation.portrait
    }

    func getContentSizeCategory() -> String {
        func getContentSizeCategoryFn() -> String {
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

        if Thread.isMainThread {
            return getContentSizeCategoryFn()
        }

        return DispatchQueue.main.sync {
            return getContentSizeCategoryFn()
        }
    }

    func getMainWindow() -> UIWindow? {
        guard let mainWindow = UIApplication.shared.connectedScenes
            .compactMap({ $0 as? UIWindowScene })
            .flatMap({ $0.windows })
            .first(where: { $0.isKeyWindow }) else {
            return nil
        }

        return mainWindow
    }

    // todo handle IME animation
    func getInsets() -> Insets {
        func getInsetsFn() -> Insets {
            guard let window = getMainWindow() else {
                // this should never happen, but it's better to return zeros
                return Insets(top: 0, bottom: 0, left: 0, right: 0, ime: 0)
            }

            let safeArea = window.safeAreaInsets

            return Insets(
                top: safeArea.top,
                bottom: safeArea.bottom,
                left: safeArea.left,
                right: safeArea.right,
                ime: keyboardAnimation.animatedImeInset
            )
        }

        if Thread.isMainThread {
            return getInsetsFn()
        }

        return DispatchQueue.main.sync {
            return getInsetsFn()
        }
    }

    func getPrefersRtlDirection() -> Bool {
        func getPrefersRtlDirectionFn() -> Bool {
            let hasForcedRtl = UserDefaults.standard.bool(forKey: "RCTI18nUtil_forceRTL")
            let isRtl = UIApplication.shared.userInterfaceLayoutDirection == .rightToLeft

            return hasForcedRtl || isRtl
        }

        if Thread.isMainThread {
            return getPrefersRtlDirectionFn()
        }

        return DispatchQueue.main.sync {
            return getPrefersRtlDirectionFn()
        }
    }

    func getStatusBarDimensions() -> Dimensions {
        func getStatusBarDimensionsFn() -> Dimensions {
            guard let window = getMainWindow(),
                  let statusBarManager = window.windowScene?.statusBarManager else {
                // this should never happen, but it's better to return defaults
                return Dimensions(width: 0, height: 0)
            }

            let statusBarSize = statusBarManager.statusBarFrame.size

            return Dimensions(width: statusBarSize.width, height: statusBarSize.height)
        }

        if Thread.isMainThread {
            return getStatusBarDimensionsFn()
        }

        return DispatchQueue.main.sync {
            return getStatusBarDimensionsFn()
        }
    }

    func getPixelRatio() -> Double {
        func getPixelRatioFn() -> Double {
            guard let presentedViewController = RCTPresentedViewController(),
                  let window = presentedViewController.view.window else {

                // when user goes to background RCTPresentedViewController is not available, try to get last known value
                if let cachedRuntime = self.miniRuntime, UIApplication.shared.applicationState == .background {
                    return cachedRuntime.pixelRatio;
                }
                
                // this should never happen, but it's better to return default
                return 1
            }

            return window.screen.scale
        }

        if Thread.isMainThread {
            return getPixelRatioFn()
        }

        return DispatchQueue.main.sync {
            return getPixelRatioFn()
        }
    }

    func setRootViewBackgroundColor(color: Double) throws {
        DispatchQueue.main.async {
            guard let presentedViewController = RCTPresentedViewController() else {
                print("🦄 Unistyles: Couldn't set rootView backgroundColor")

                return
            }

            presentedViewController.view.backgroundColor = UIColor.fromInt(Int(color))
        }
    }

    func getNavigationBarDimensions() -> Dimensions {
        return Dimensions(width: 0, height: 0)
    }

    func setStatusBarHidden(isHidden: Bool) throws {
        self.onNativePlatformChange()
    }

    // not implemented for iOS as there are no such APIs
    func setNavigationBarHidden(isHidden: Bool) throws {}

    // implemented from JS
    func setImmersiveMode(isEnabled: Bool) throws {}
}

#endif
