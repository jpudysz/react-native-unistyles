package com.unistyles

class Dimensions(var width: Int, var height: Int) {
    fun isEqual(dimensions: Dimensions): Boolean {
        if (this.width != dimensions.width) {
            return false
        }

        return this.height == dimensions.height
    }

    override fun toString(): String {
        return "${width}x${height}"
    }
}

class Insets(var top: Int, var bottom: Int, var left: Int, var right: Int) {
    fun isEqual(insets: Insets): Boolean {
        if (this.top != insets.top) {
            return false
        }

        if (this.bottom != insets.bottom) {
            return false
        }

        if (this.left != insets.left) {
            return false
        }

        return this.right == insets.right
    }

    override fun toString(): String {
        return "T:${top}B:${bottom}L:${left}R:${right}"
    }
}

class LayoutConfig(
    val screen: Dimensions,
    val insets: Insets,
    val statusBar: Dimensions,
    val navigationBar: Dimensions
) {
    fun isEqual(config: LayoutConfig): Boolean {
        if (!this.screen.isEqual(config.screen)) {
            return false
        }

        if (!this.insets.isEqual(config.insets)) {
            return false
        }

        if (!this.statusBar.isEqual(config.statusBar)) {
            return false
        }

        return this.navigationBar.isEqual(config.navigationBar)
    }

    override fun toString(): String {
        return buildString {
            append("screen=")
            append(screen)
            append(" insets=")
            append(insets)
            append(" statusBar=")
            append(statusBar)
            append(" navigationBar=")
            append(navigationBar)
        }
    }
}

class Config(
    val colorScheme: String,
    val contentSizeCategory: String,
) {
    var hasNewColorScheme: Boolean = false
    var hasNewContentSizeCategory: Boolean = false

    override fun toString(): String {
        return "colorScheme=${colorScheme} contentSizeCategory:${contentSizeCategory}"
    }
}
