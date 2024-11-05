package com.unistyles

import com.margelo.nitro.unistyles.ColorScheme
import com.margelo.nitro.unistyles.Dimensions
import com.margelo.nitro.unistyles.HybridNativePlatformSpec
import com.margelo.nitro.unistyles.Insets
import com.margelo.nitro.unistyles.Orientation
import com.margelo.nitro.unistyles.UnistyleDependency
import com.margelo.nitro.unistyles.UnistylesNativeMiniRuntime

class NativePlatform: HybridNativePlatformSpec() {
    override fun getInsets(): Insets {
        TODO("Not yet implemented")
    }

    override fun getColorScheme(): ColorScheme {
        TODO("Not yet implemented")
    }

    override fun getFontScale(): Double {
        TODO("Not yet implemented")
    }

    override fun getPixelRatio(): Double {
        TODO("Not yet implemented")
    }

    override fun getOrientation(): Orientation {
        TODO("Not yet implemented")
    }

    override fun getContentSizeCategory(): String {
        TODO("Not yet implemented")
    }

    override fun getScreenDimensions(): Dimensions {
        TODO("Not yet implemented")
    }

    override fun getStatusBarDimensions(): Dimensions {
        TODO("Not yet implemented")
    }

    override fun getNavigationBarDimensions(): Dimensions {
        TODO("Not yet implemented")
    }

    override fun getPrefersRtlDirection(): Boolean {
        TODO("Not yet implemented")
    }

    override fun setRootViewBackgroundColor(color: Double) {
        TODO("Not yet implemented")
    }

    override fun setNavigationBarBackgroundColor(color: Double) {
        TODO("Not yet implemented")
    }

    override fun setNavigationBarHidden(isHidden: Boolean) {
        TODO("Not yet implemented")
    }

    override fun setStatusBarHidden(isHidden: Boolean) {
        TODO("Not yet implemented")
    }

    override fun setStatusBarBackgroundColor(color: Double) {
        TODO("Not yet implemented")
    }

    override fun setImmersiveMode(isEnabled: Boolean) {
        TODO("Not yet implemented")
    }

    override fun getMiniRuntime(): UnistylesNativeMiniRuntime {
        TODO("Not yet implemented")
    }

    override fun registerPlatformListener(callback: (dependencies: Array<UnistyleDependency>) -> Unit) {
        TODO("Not yet implemented")
    }

    override fun registerImeListener(callback: () -> Unit) {
        TODO("Not yet implemented")
    }

    override fun unregisterPlatformListeners() {
        TODO("Not yet implemented")
    }

    override val memorySize: Long
        get() = TODO("Not yet implemented")
}
