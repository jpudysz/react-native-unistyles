package com.unistyles

import android.annotation.SuppressLint
import android.content.res.Configuration
import com.facebook.react.bridge.ReactApplicationContext

class UnistylesConfig(private val reactApplicationContext: ReactApplicationContext) {
    private val insets: UnistylesInsets = UnistylesInsets(reactApplicationContext)
    private val density: Float = reactApplicationContext.resources.displayMetrics.density
    private var lastConfig: Config = this.getAppConfig()
    private var lastLayoutConfig: LayoutConfig = this.getAppLayoutConfig()

    fun hasNewConfig(): Boolean {
        val newConfig = this.getAppConfig()
        val newContentSizeCategory = newConfig.contentSizeCategory != lastConfig.contentSizeCategory
        val newColorScheme = newConfig.colorScheme != lastConfig.colorScheme

        if (!newContentSizeCategory && !newColorScheme) {
            return false
        }

        lastConfig = newConfig
        lastConfig.hasNewContentSizeCategory = newContentSizeCategory
        lastConfig.hasNewColorScheme = newColorScheme

        return true
    }

    fun hasNewLayoutConfig(): Boolean {
        val newConfig = this.getAppLayoutConfig()

        if (newConfig.isEqual(lastLayoutConfig)) {
            return false
        }

        lastLayoutConfig = newConfig

        return true
    }

    fun getConfig(): Config {
        return this.lastConfig
    }

    fun getLayoutConfig(): LayoutConfig {
        return this.lastLayoutConfig
    }

    private fun getAppConfig(): Config {
        return Config(
            this.getColorScheme(),
            this.getContentSizeCategory(),
        )
    }

    private fun getAppLayoutConfig(): LayoutConfig {
        val displayMetrics = reactApplicationContext.resources.displayMetrics
        val screenWidth = (displayMetrics.widthPixels / density).toInt()
        val screenHeight = (displayMetrics.heightPixels / density).toInt()

        return LayoutConfig(
            Dimensions(screenWidth, screenHeight),
            this.insets.get(),
            Dimensions(screenWidth, getStatusBarHeight()),
            Dimensions(screenWidth, getNavigationBarHeight())
        )
    }

    fun getScreenDimensions(): Dimensions {
        val displayMetrics = reactApplicationContext.resources.displayMetrics
        val screenWidth = (displayMetrics.widthPixels / density).toInt()
        val screenHeight = (displayMetrics.heightPixels / density).toInt()

        return Dimensions(screenWidth, screenHeight)
    }

    fun getContentSizeCategory(): String {
        val fontScale = reactApplicationContext.resources.configuration.fontScale

        val contentSizeCategory = when {
            fontScale <= 0.85f -> "Small"
            fontScale <= 1.0f -> "Default"
            fontScale <= 1.15f -> "Large"
            fontScale <= 1.3f -> "ExtraLarge"
            fontScale <= 1.5f -> "Huge"
            fontScale <= 1.8 -> "ExtraHuge"
            else -> "ExtraExtraHuge"
        }

        return contentSizeCategory
    }

    fun getColorScheme(): String {
        val colorScheme = when (reactApplicationContext.resources.configuration.uiMode.and(Configuration.UI_MODE_NIGHT_MASK)) {
            Configuration.UI_MODE_NIGHT_YES -> "dark"
            Configuration.UI_MODE_NIGHT_NO -> "light"
            else -> "unspecified"
        }

        return colorScheme
    }

    fun getStatusBarDimensions(): Dimensions {
        val displayMetrics = reactApplicationContext.resources.displayMetrics
        val screenWidth = (displayMetrics.widthPixels / density).toInt()

        return Dimensions(screenWidth, getStatusBarHeight())
    }

    fun getNavigationBarDimensions(): Dimensions {
        val displayMetrics = reactApplicationContext.resources.displayMetrics
        val screenWidth = (displayMetrics.widthPixels / density).toInt()

        return Dimensions(screenWidth, getNavigationBarHeight())
    }

    fun getInsets(): Insets {
        return this.insets.get()
    }

    @SuppressLint("InternalInsetResource", "DiscouragedApi")
    private fun getStatusBarHeight(): Int {
        val heightResId = reactApplicationContext.resources.getIdentifier("status_bar_height", "dimen", "android")

        if (heightResId > 0) {
            return (reactApplicationContext.resources.getDimensionPixelSize(heightResId) / density).toInt()
        }

        return 0
    }

    @SuppressLint("InternalInsetResource", "DiscouragedApi")
    private fun getNavigationBarHeight(): Int {
        val heightResId = reactApplicationContext.resources.getIdentifier("navigation_bar_height", "dimen", "android")

        if (heightResId > 0) {
            return (reactApplicationContext.resources.getDimensionPixelSize(heightResId) / density).toInt()
        }

        return 0
    }
}
