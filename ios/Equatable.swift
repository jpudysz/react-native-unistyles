import Foundation

func dimensionsEqual(_ lhs: Dimensions, _ rhs: Dimensions) -> Bool {
    return lhs.width == rhs.width && lhs.height == rhs.height
}

func insetsEqual(_ lhs: Insets, _ rhs: Insets) -> Bool {
    if (lhs.ime != rhs.ime) {
        return false
    }
    
    return lhs.top == rhs.top && lhs.bottom == rhs.bottom &&
           lhs.left == rhs.left && lhs.right == rhs.right
}

extension UnistylesNativeMiniRuntime {
    static func diff(lhs: UnistylesNativeMiniRuntime, rhs: UnistylesNativeMiniRuntime) -> Array<UnistyleDependency> {
        var dependencies: Array<UnistyleDependency> = []

        if (lhs.colorScheme != rhs.colorScheme) {
            dependencies.append(UnistyleDependency.colorscheme)
        }

        if !dimensionsEqual(lhs.screen, rhs.screen) {
            dependencies.append(UnistyleDependency.dimensions)
        }

        if (lhs.screen.width != rhs.screen.width) {
            dependencies.append(UnistyleDependency.breakpoints)
        }

        // no need to check isLandscape, as it's always opposite
        if (lhs.isPortrait != rhs.isPortrait) {
            dependencies.append(UnistyleDependency.orientation)
        }

        if (lhs.contentSizeCategory != rhs.contentSizeCategory) {
            dependencies.append(UnistyleDependency.contentsizecategory)
        }

        if !insetsEqual(lhs.insets, rhs.insets) {
            dependencies.append(UnistyleDependency.insets)
        }

        if (lhs.fontScale != rhs.fontScale) {
            dependencies.append(UnistyleDependency.fontscale)
        }

        if !dimensionsEqual(lhs.statusBar, rhs.statusBar) {
            dependencies.append(UnistyleDependency.statusbar)
        }

        // rtl and pixel ratio are not dynamic
        // navigation bar is not supported for iOS

        return dependencies
    }
}
