package com.unistyles

class Dimensions(
    var width: Int,
    var height: Int
) {
    override fun toString(): String {
        return "${width}x${height}"
    }
}

class Screen(
    var width: Int,
    var height: Int,
    var pixelRatio: Float,
    var fontScale: Float
) {
    override fun toString(): String {
        return "${width}x${height} ${pixelRatio} ${fontScale}"
    }
}

class Insets(var top: Int, var bottom: Int, var left: Int, var right: Int) {
    override fun toString(): String {
        return "T:${top}B:${bottom}L:${left}R:${right}"
    }
}
