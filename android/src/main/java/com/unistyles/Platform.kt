package com.unistyles

import android.annotation.SuppressLint
import android.content.res.Configuration
import android.os.Build
import android.view.WindowInsets
import com.facebook.react.bridge.ReactApplicationContext

class Platform(private val reactApplicationContext: ReactApplicationContext) {
    @SuppressLint("InternalInsetResource", "DiscouragedApi", "ObsoleteSdkInt")
    fun getConfig(): Map<String, Any> {
        val displayMetrics = reactApplicationContext.resources.displayMetrics
        val fontScale = reactApplicationContext.resources.configuration.fontScale
        val screenWidth = (displayMetrics.widthPixels / displayMetrics.density).toInt()
        val screenHeight = (displayMetrics.heightPixels / displayMetrics.density).toInt()

        return mapOf(
            "width" to screenWidth,
            "height" to screenHeight,
            "colorScheme" to getColorScheme(),
            "contentSizeCategory" to getContentSizeCategory(fontScale),
            "insets" to getScreenInsets(displayMetrics.density),
            "statusBar" to mapOf(
                "height" to getStatusBarHeight(displayMetrics.density),
                "width" to screenWidth
            )
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

    @Suppress("DEPRECATION")
    private fun getScreenInsets(density: Float): Map<String, Int> {
        val insets = mutableMapOf(
            "top" to 0,
            "bottom" to 0,
            "left" to 0,
            "right" to 0
        )

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            val systemInsets = reactApplicationContext.currentActivity?.window?.decorView?.rootWindowInsets?.getInsets(WindowInsets.Type.displayCutout())

            insets["top"] = ((systemInsets?.top ?: 0) / density).toInt()
            insets["bottom"] = ((systemInsets?.bottom ?: 0) / density).toInt()
            insets["left"] = ((systemInsets?.left ?: 0) / density).toInt()
            insets["right"] = ((systemInsets?.right ?: 0) / density).toInt()

            return insets
        }

        val systemInsets = reactApplicationContext.currentActivity?.window?.decorView?.rootWindowInsets

        insets["top"] = ((systemInsets?.systemWindowInsetTop ?: 0) / density).toInt()
        insets["bottom"] = ((systemInsets?.systemWindowInsetBottom ?: 0) / density).toInt()
        insets["left"] = ((systemInsets?.systemWindowInsetLeft ?: 0) / density).toInt()
        insets["right"] = ((systemInsets?.systemWindowInsetRight ?: 0) / density).toInt()

        return insets
    }

    @SuppressLint("InternalInsetResource", "DiscouragedApi")
    private fun getStatusBarHeight(density: Float): Int {
        val heightResId = reactApplicationContext.resources.getIdentifier("status_bar_height", "dimen", "android")

        if (heightResId > 0) {
            return (reactApplicationContext.resources.getDimensionPixelSize(heightResId) / density).toInt()
        }

        return 0
    }
}
