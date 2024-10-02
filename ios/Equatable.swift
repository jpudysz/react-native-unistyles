import Foundation

extension Dimensions: Equatable {
    public static func == (lhs: Dimensions, rhs: Dimensions) -> Bool {
        return lhs.width == rhs.width && lhs.height == rhs.height
    }
}

extension Insets: Equatable {
    public static func == (lhs: Insets, rhs: Insets) -> Bool {
        if (lhs.top != rhs.top || lhs.bottom != rhs.bottom) {
            return false
        }

        if (lhs.left != rhs.left || lhs.right != rhs.right) {
            return false
        }

        return lhs.ime == rhs.ime
    }
}

extension UnistylesNativeMiniRuntime {
    static func diff(lhs: UnistylesNativeMiniRuntime, rhs: UnistylesNativeMiniRuntime) -> Array<UnistyleDependency> {
        var dependencies: Array<UnistyleDependency> = []

        if (lhs.colorScheme != rhs.colorScheme) {
            dependencies.append(UnistyleDependency.colorscheme)
        }

        if (lhs.screen != rhs.screen) {
            dependencies.append(UnistyleDependency.dimensions)
        }

        if (lhs.screen.width != rhs.screen.width) {
            dependencies.append(UnistyleDependency.breakpoints)
        }

        if (lhs.orientation != rhs.orientation) {
            dependencies.append(UnistyleDependency.orientation)
        }

        if (lhs.contentSizeCategory != rhs.contentSizeCategory) {
            dependencies.append(UnistyleDependency.contentsizecategory)
        }

        if (lhs.insets != rhs.insets) {
            dependencies.append(UnistyleDependency.insets)
        }

        if (lhs.fontScale != rhs.fontScale) {
            dependencies.append(UnistyleDependency.fontscale)
        }

        if (lhs.statusBar != rhs.statusBar) {
            dependencies.append(UnistyleDependency.statusbar)
        }

        // rtl and pixel ratio are not dynamic
        // navigation bar is not supported for iOS

        return dependencies
    }
}
