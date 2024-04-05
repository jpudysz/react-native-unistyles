package com.unistyles

import android.content.Context
import android.graphics.Rect
import android.os.Build
import android.view.View
import android.view.Window
import android.view.WindowInsets
import android.view.WindowManager
import com.facebook.react.bridge.ReactApplicationContext
import kotlin.math.roundToInt

class UnistylesInsets(private val reactApplicationContext: ReactApplicationContext) {
    private val density: Float = reactApplicationContext.resources.displayMetrics.density

    fun get(): Insets {
        return this.getCurrentInsets()
    }

    private fun getCurrentInsets(): Insets {
        val baseInsets = this.getBaseInsets()
        val statusBarTranslucent = this.hasTranslucentStatusBar() ?: return baseInsets
        val window = reactApplicationContext.currentActivity?.window ?: return baseInsets
        val shouldModifyLandscapeInsets = this.forceLandscapeInsets(baseInsets, window)

        val topInset = this.getTopInset(baseInsets, statusBarTranslucent, window)
        val bottomInset = this.getBottomInset(baseInsets, window)
        val leftInset = if (shouldModifyLandscapeInsets) 0 else baseInsets.left
        val rightInset = if (shouldModifyLandscapeInsets) 0 else baseInsets.right

        return Insets(topInset, bottomInset, leftInset, rightInset)
    }

    @Suppress("DEPRECATION")
    private fun getBaseInsets(): Insets {
        // this is the best API, but it's available from Android 11
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            val windowManager = reactApplicationContext.getSystemService(Context.WINDOW_SERVICE) as WindowManager
            val systemBarsInsets = windowManager.currentWindowMetrics.windowInsets.getInsets(WindowInsets.Type.systemBars())

            val top = (systemBarsInsets.top / density).roundToInt()
            val bottom = (systemBarsInsets.bottom / density).roundToInt()
            val left = (systemBarsInsets.left / density).roundToInt()
            val right = (systemBarsInsets.right / density).roundToInt()

            return Insets(top, bottom, left, right)
        }

        // available from Android 6.0
        val window = reactApplicationContext.currentActivity?.window ?: return Insets(0, 0, 0, 0)
        val systemInsets = window.decorView.rootWindowInsets ?: return Insets(0, 0, 0, 0)

        val top = (systemInsets.systemWindowInsetTop / density).roundToInt()
        val bottom = (systemInsets.systemWindowInsetBottom / density).roundToInt()
        val left = (systemInsets.systemWindowInsetLeft / density).roundToInt()
        val right = (systemInsets.systemWindowInsetRight / density).roundToInt()

        return Insets(top, bottom, left, right)
    }

    // this function helps to detect statusBar translucent, as React Native is using weird API instead of windows flags
    private fun hasTranslucentStatusBar(): Boolean? {
        val window = reactApplicationContext.currentActivity?.window ?: return null
        val contentView = window.decorView.findViewById<View>(android.R.id.content) ?: return null
        val decorViewLocation = IntArray(2)
        val contentViewLocation = IntArray(2)

        // decor view is a top level view with navigationBar and statusBar
        window.decorView.getLocationOnScreen(decorViewLocation)
        // content view is view without navigationBar and statusBar
        contentView.getLocationOnScreen(contentViewLocation)

        val statusBarHeight = contentViewLocation[1] - decorViewLocation[1]

        // if positions are the same, then the status bar is translucent
        return statusBarHeight == 0
    }

    private fun getTopInset(baseInsets: Insets, statusBarTranslucent: Boolean, window: Window): Int {
        if (!statusBarTranslucent) {
            return 0
        }

        return baseInsets.top
    }

    @Suppress("DEPRECATION")
    private fun getBottomInset(baseInsets: Insets, window: Window): Int {
        val translucentNavigation = hasTranslucentNavigation(window)

        // Android 11 has inconsistent FLAG_LAYOUT_NO_LIMITS, which alone does nothing
        // https://stackoverflow.com/questions/64153785/android-11-window-setdecorfitssystemwindow-doesnt-show-screen-behind-status-a
        if (Build.VERSION.SDK_INT == Build.VERSION_CODES.R) {
            if ((hasFullScreenMode(window) && translucentNavigation) || translucentNavigation) {
                return baseInsets.bottom
            }

            return 0
        }

        return if (hasTranslucentNavigation(window) || hasFullScreenMode(window)) baseInsets.bottom else 0
    }

    private fun forceLandscapeInsets(baseInsets: Insets, window: Window): Boolean {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            return false
        }

        val displayMetrics = reactApplicationContext.resources.displayMetrics
        val isLandscape = displayMetrics.widthPixels > displayMetrics.heightPixels

        if (!isLandscape) {
            return false
        }

        val contentView = window.decorView.findViewById<View>(android.R.id.content) ?: return false
        val visibleRect = Rect()
        val drawingRect = Rect()

        window.decorView.getGlobalVisibleRect(visibleRect)
        contentView.getDrawingRect(drawingRect)

        // width is equal to navigationBarHeight + statusBarHeight (in landscape)
        val width = ((visibleRect.width() - contentView.width) / density).roundToInt()

        // we should correct landscape if insets are equal to width
        return (baseInsets.left + baseInsets.right) == width
    }

    @Suppress("DEPRECATION")
    private fun hasTranslucentNavigation(window: Window): Boolean {
        return (window.attributes.flags and WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION) == WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION
    }

    private fun hasFullScreenMode(window: Window): Boolean {
        return (window.attributes.flags and WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS) == WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS
    }
}
