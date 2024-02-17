package com.unistyles

import android.annotation.SuppressLint
import android.content.Context
import android.content.res.Configuration
import android.os.Build
import android.view.WindowInsets
import android.view.WindowManager
import com.facebook.react.bridge.ReactApplicationContext
import kotlin.math.roundToInt

class Dimensions(var width: Int, var height: Int)
class Insets(var top: Int, var bottom: Int, var left: Int, var right: Int)

class Platform(private val reactApplicationContext: ReactApplicationContext) {
    @SuppressLint("InternalInsetResource", "DiscouragedApi", "ObsoleteSdkInt")
    fun getConfig(): Map<String, Any> {
        val displayMetrics = reactApplicationContext.resources.displayMetrics
        val fontScale = reactApplicationContext.resources.configuration.fontScale
        val screenWidth = (displayMetrics.widthPixels / displayMetrics.density).toInt()
        val screenHeight = (displayMetrics.heightPixels / displayMetrics.density).toInt()

        return mapOf(
            "screen" to Dimensions(screenWidth, screenHeight),
            "colorScheme" to getColorScheme(),
            "contentSizeCategory" to getContentSizeCategory(fontScale),
            "insets" to getScreenInsets(displayMetrics.density),
            "statusBar" to Dimensions(screenWidth, getStatusBarHeight(displayMetrics.density))
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
    private fun getScreenInsets(density: Float): Insets  {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            val windowManager = reactApplicationContext.getSystemService(Context.WINDOW_SERVICE) as WindowManager
            val systemBarsInsets = windowManager.currentWindowMetrics.windowInsets.getInsets(WindowInsets.Type.systemBars())

            val top = (systemBarsInsets.top / density).roundToInt()
            val bottom = (systemBarsInsets.bottom / density).roundToInt()
            val left = (systemBarsInsets.left / density).roundToInt()
            val right = (systemBarsInsets.right / density).roundToInt()

            return Insets(top, bottom, left, right)
        }

        val systemInsets = reactApplicationContext.currentActivity?.window?.decorView?.rootWindowInsets
            ?: return Insets(0, 0, 0, 0)

        val top = (systemInsets.systemWindowInsetTop / density).roundToInt()
        val bottom = (systemInsets.systemWindowInsetBottom / density).roundToInt()
        val left = (systemInsets.systemWindowInsetLeft / density).roundToInt()
        val right = (systemInsets.systemWindowInsetRight / density).roundToInt()

        return Insets(top, bottom, left, right)
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
