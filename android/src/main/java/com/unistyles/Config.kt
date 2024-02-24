package com.unistyles

import android.annotation.SuppressLint
import android.content.res.Configuration
import android.util.Log
import com.facebook.react.bridge.ReactApplicationContext

class UnistylesConfig(private val reactApplicationContext: ReactApplicationContext) {
    private val insets: UnistylesInsets = UnistylesInsets(reactApplicationContext)
    private val density: Float = reactApplicationContext.resources.displayMetrics.density
    private var lastConfig: Config = this.getConfig()

    fun hasNewConfig(): Boolean {
        val newConfig = this.get()

        if (newConfig.isEqual(lastConfig)) {
            return false
        }

        lastConfig = newConfig

        // todo remove me
        Log.d("unistyes", "New Config")
        Log.d("unistyes", newConfig.toString())

        return true
    }

    fun get(): Config {
        return this.getConfig()
    }

    @SuppressLint("InternalInsetResource", "DiscouragedApi", "ObsoleteSdkInt")
    private fun getConfig(): Config {
        val displayMetrics = reactApplicationContext.resources.displayMetrics
        val fontScale = reactApplicationContext.resources.configuration.fontScale
        val screenWidth = (displayMetrics.widthPixels / density).toInt()
        val screenHeight = (displayMetrics.heightPixels / density).toInt()

        return Config(
            Dimensions(screenWidth, screenHeight),
            this.getColorScheme(),
            this.getContentSizeCategory(fontScale),
            this.insets.get(),
            Dimensions(screenWidth, getStatusBarHeight()),
            Dimensions(screenWidth, getNavigationBarHeight())
        )
    }

    private fun getContentSizeCategory(fontScale: Float): String {
        val contentSizeCategory = when {
            fontScale <= 0.85f -> "Small"
            fontScale <= 1.0f -> "Default"
            fontScale <= 1.15f -> "Large"
            fontScale <= 1.3f -> "ExtraLarge"
            else -> "Huge"
        }

        return contentSizeCategory
    }

    private fun getColorScheme(): String {
        val colorScheme = when (reactApplicationContext.resources.configuration.uiMode.and(Configuration.UI_MODE_NIGHT_MASK)) {
            Configuration.UI_MODE_NIGHT_YES -> "dark"
            Configuration.UI_MODE_NIGHT_NO -> "light"
            else -> "unspecified"
        }

        return colorScheme
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
