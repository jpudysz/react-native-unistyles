package com.unistyles

import android.annotation.SuppressLint
import android.content.Context
import android.content.res.Configuration
import android.graphics.Rect
import android.os.Build
import android.view.View
import android.view.ViewGroup
import android.view.Window
import android.view.WindowInsets
import android.view.WindowManager
import com.facebook.react.bridge.ReactApplicationContext
import kotlin.math.roundToInt

class Platform(private val reactApplicationContext: ReactApplicationContext) {
    private var insets: Insets = this.getScreenInsets()

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
            "insets" to getScreenInsets(),
            "statusBar" to Dimensions(screenWidth, getStatusBarHeight(displayMetrics.density))
        )
    }

    fun hasNewInsets(): Boolean {
        val newInsets = this.getScreenInsets()
        val hasNewInsets = !newInsets.areEqual(this.insets)

        if (hasNewInsets) {
            this.insets = newInsets
        }

        return hasNewInsets
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
    private fun getBaseInsets(): Insets {
        val density = reactApplicationContext.resources.displayMetrics.density

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            val windowManager = reactApplicationContext.getSystemService(Context.WINDOW_SERVICE) as WindowManager
            val systemBarsInsets = windowManager.currentWindowMetrics.windowInsets.getInsets(WindowInsets.Type.systemBars())

            val top = (systemBarsInsets.top / density).roundToInt()
            val bottom = (systemBarsInsets.bottom / density).roundToInt()
            val left = (systemBarsInsets.left / density).roundToInt()
            val right = (systemBarsInsets.right / density).roundToInt()

            return Insets(top, bottom, left, right)
        }

        val window = reactApplicationContext.currentActivity?.window ?: return Insets(0, 0, 0, 0)
        val systemInsets = window.decorView.rootWindowInsets

        val top = (systemInsets.systemWindowInsetTop / density).roundToInt()
        val bottom = (systemInsets.systemWindowInsetBottom / density).roundToInt()
        val left = (systemInsets.systemWindowInsetLeft / density).roundToInt()
        val right = (systemInsets.systemWindowInsetRight / density).roundToInt()

        return Insets(top, bottom, left, right)
    }

    private fun getScreenInsets(): Insets {
        val baseInsets = getBaseInsets()

        val density = reactApplicationContext.resources.displayMetrics.density
        val window = reactApplicationContext.currentActivity?.window ?: return baseInsets
        val contentView = window.decorView.findViewById<View>(android.R.id.content) ?: return baseInsets

        val visibleRect = Rect()
        val drawingRect = Rect()

        window.decorView.getGlobalVisibleRect(visibleRect)
        contentView.getDrawingRect(drawingRect)

        val visibleHeight = visibleRect.height()
        val visibleWidth = visibleRect.width()

        (window.decorView as ViewGroup).offsetDescendantRectToMyCoords(contentView, drawingRect)

        val accessibleWidth = contentView.width
        val accessibleHeight = contentView.height

        val height = ((visibleHeight - accessibleHeight) / density).roundToInt()
        val width = ((visibleWidth - accessibleWidth) / density).roundToInt()
        val navigationBarHeight = this.getNavigationBarHeight(density)
        val statusBarHeight = this.getStatusBarHeight(density)

        val topInset = statusBarHeight + navigationBarHeight - height
        val bottomInset = if (hasTranslucentNavigation(window)) baseInsets.bottom else 0

        return Insets(topInset, bottomInset, baseInsets.left, baseInsets.right)
    }

    private fun hasFullScreenMode(window: Window): Boolean {
        return (window.attributes.flags and WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS) == WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS
    }

    @Suppress("DEPRECATION")
    private fun hasTranslucentNavigation(window: Window): Boolean {
        return (window.attributes.flags and WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION) == WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION
    }

    @SuppressLint("InternalInsetResource", "DiscouragedApi")
    private fun getStatusBarHeight(density: Float): Int {
        val heightResId = reactApplicationContext.resources.getIdentifier("status_bar_height", "dimen", "android")

        if (heightResId > 0) {
            return (reactApplicationContext.resources.getDimensionPixelSize(heightResId) / density).toInt()
        }

        return 0
    }

    @SuppressLint("InternalInsetResource", "DiscouragedApi")
    private fun getNavigationBarHeight(density: Float): Int {
        val heightResId = reactApplicationContext.resources.getIdentifier("navigation_bar_height", "dimen", "android")

        if (heightResId > 0) {
            return (reactApplicationContext.resources.getDimensionPixelSize(heightResId) / density).toInt()
        }

        return 0
    }
}
