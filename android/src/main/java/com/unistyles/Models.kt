package com.unistyles

class Dimensions(var width: Int, var height: Int)
class Insets(var top: Int, var bottom: Int, var left: Int, var right: Int) {
    fun areEqual(insets: Insets): Boolean {
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
}
