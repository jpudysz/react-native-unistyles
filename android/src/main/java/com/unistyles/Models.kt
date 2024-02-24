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

class Config(
    val screen: Dimensions,
    val colorScheme: String,
    val contentSizeCategory: String,
    val insets: Insets,
    val statusBar: Dimensions,
    val navigationBar: Dimensions
) {
    fun isEqual(config: Config): Boolean {
        if (!this.screen.isEqual(config.screen)) {
            return false
        }

        if (this.colorScheme != config.colorScheme) {
            return false
        }

        if (this.contentSizeCategory != config.contentSizeCategory) {
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
            append(" colorScheme=")
            append(colorScheme)
            append(" contentSizeCategory=")
            append(contentSizeCategory)
            append(" insets=")
            append(insets)
            append(" statusBar=")
            append(statusBar)
            append(" navigationBar=")
            append(navigationBar)
        }
    }
}
