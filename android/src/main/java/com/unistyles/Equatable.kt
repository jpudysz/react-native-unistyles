package com.unistyles

import com.margelo.nitro.unistyles.Dimensions
import com.margelo.nitro.unistyles.Insets
import com.margelo.nitro.unistyles.UnistyleDependency
import com.margelo.nitro.unistyles.UnistylesNativeMiniRuntime

fun Dimensions.isEqualTo(other: Dimensions): Boolean {
    return this.width == other.width && this.height == other.height
}

fun Insets.isEqualTo(other: Insets): Boolean {
    return this.top == other.top && this.bottom == other.bottom &&
        this.left == other.left && this.right == other.right &&
        this.ime == other.ime
}

fun NativePlatformAndroid.diffMiniRuntimes(lhs: UnistylesNativeMiniRuntime, rhs: UnistylesNativeMiniRuntime): Array<UnistyleDependency> {
    val dependencies: MutableList<UnistyleDependency> = mutableListOf()

    if (lhs.colorScheme != rhs.colorScheme) {
        dependencies.add(UnistyleDependency.COLORSCHEME)
    }

    if (!lhs.screen.isEqualTo(rhs.screen)) {
        dependencies.add(UnistyleDependency.DIMENSIONS)
    }

    if (lhs.screen.width != rhs.screen.width) {
        dependencies.add(UnistyleDependency.BREAKPOINTS)
    }

    // no need to check isLandscape, as it's always opposite
    if (lhs.isPortrait != rhs.isPortrait) {
        dependencies.add(UnistyleDependency.ORIENTATION)
    }

    if (lhs.contentSizeCategory != rhs.contentSizeCategory) {
        dependencies.add(UnistyleDependency.CONTENTSIZECATEGORY)
    }

    if (!lhs.insets.isEqualTo(rhs.insets)) {
        dependencies.add(UnistyleDependency.INSETS)
    }

    if (lhs.fontScale != rhs.fontScale) {
        dependencies.add(UnistyleDependency.FONTSCALE)
    }

    if (!lhs.statusBar.isEqualTo(rhs.statusBar)) {
        dependencies.add(UnistyleDependency.STATUSBAR)
    }

    if (!lhs.navigationBar.isEqualTo(rhs.navigationBar)) {
        dependencies.add(UnistyleDependency.NAVIGATIONBAR)
    }

    // rtl and pixel ratio are not dynamic

    return dependencies.toTypedArray()
}
