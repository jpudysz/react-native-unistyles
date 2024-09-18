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

        // todo move orientation to native
        // orientation

        if (lhs.contentSizeCategory != rhs.contentSizeCategory) {
            dependencies.append(UnistyleDependency.contentsizecategory)
        }

        if (lhs.insets != rhs.insets) {
            dependencies.append(UnistyleDependency.insets)
        }

        if (lhs.pixelRatio != rhs.pixelRatio) {
            dependencies.append(UnistyleDependency.pixelratio)
        }

        if (lhs.fontScale != rhs.fontScale) {
            dependencies.append(UnistyleDependency.fontscale)
        }

        if (lhs.statusBar != rhs.statusBar) {
            dependencies.append(UnistyleDependency.statusbar)
        }

        // rtl is not dynamic, so ignore it
        // navigation bar is not supported for iOS

        return dependencies
    }
}
