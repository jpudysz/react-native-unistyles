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

class InsetsCompat(
    val statusBar: Insets,
    val navigationBar: Insets,
    val cutout: Insets
) {
    override fun toString(): String {
        return buildString {
            append(" statusBar=")
            append(statusBar)
            append(" navigationBar=")
            append(navigationBar)
            append(" cutout=")
            append(cutout)
        }
    }

    companion object {
        fun getDefaults(): InsetsCompat {
            return InsetsCompat(
                Insets(0, 0, 0, 0),
                Insets(0, 0, 0, 0),
                Insets(0, 0, 0, 0)
            )
        }
    }
}
