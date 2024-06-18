package com.unistyles

import android.content.res.Configuration
import android.graphics.Rect
import android.view.View
import androidx.core.view.WindowInsetsCompat
import com.facebook.react.bridge.ReactApplicationContext
import kotlin.math.max

class Platform(private val reactApplicationContext: ReactApplicationContext) {
    private var insetsCompat: InsetsCompat = InsetsCompat.getDefaults()

    var defaultNavigationBarColor: Int? = null
    var defaultStatusBarColor: Int? = null
    var orientation: Int = reactApplicationContext.resources.configuration.orientation

    fun getScreenDimensions(): Screen {
        val displayMetrics = reactApplicationContext.resources.displayMetrics
        val fontScale = reactApplicationContext.resources.configuration.fontScale
        val screenWidth = (displayMetrics.widthPixels / displayMetrics.density).toInt()
        val screenHeight = (displayMetrics.heightPixels / displayMetrics.density).toInt()

        return Screen(screenWidth, screenHeight, displayMetrics.density, fontScale)
    }

    fun getColorScheme(): String {
        val uiMode = this.reactApplicationContext.resources.configuration.uiMode

        val colorScheme = when (uiMode.and(Configuration.UI_MODE_NIGHT_MASK)) {
            Configuration.UI_MODE_NIGHT_YES -> "dark"
            Configuration.UI_MODE_NIGHT_NO -> "light"
            else -> "unspecified"
        }

        return colorScheme
    }

    fun getStatusBarDimensions(): Dimensions {
        val displayMetrics = reactApplicationContext.resources.displayMetrics
        val screenWidth = (displayMetrics.widthPixels / displayMetrics.density).toInt()

        return Dimensions(screenWidth, getStatusBarHeight())
    }

    fun getNavigationBarDimensions(): Dimensions {
        val displayMetrics = reactApplicationContext.resources.displayMetrics
        val screenWidth = (displayMetrics.widthPixels / displayMetrics.density).toInt()

        return Dimensions(screenWidth, getNavigationBarHeight())
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

    fun setInsetsCompat(insetsCompat: WindowInsetsCompat, decorView: View) {
        val statusBar = insetsCompat.getInsets(WindowInsetsCompat.Type.statusBars())
        val navigationBar = insetsCompat.getInsets(WindowInsetsCompat.Type.navigationBars())
        val cutout = insetsCompat.getInsets(WindowInsetsCompat.Type.displayCutout())

        // get the visible frame of the window to detect translucent status bar
        // react native (and expo) are setting top inset to 0
        // so there is no other way to detect if status bar is hidden or translucent
        val visibleFrame = Rect()
        decorView.getWindowVisibleDisplayFrame(visibleFrame)

        val visibleTopFrame = max(visibleFrame.top, statusBar.top)

        this.insetsCompat = InsetsCompat(
            Insets(visibleTopFrame, statusBar.bottom, statusBar.left, statusBar.right),
            Insets(navigationBar.top, navigationBar.bottom, navigationBar.left, navigationBar.right),
            Insets(cutout.top, cutout.bottom, cutout.left, cutout.right)
        )
    }

    fun getInsets(): Insets {
        val density = reactApplicationContext.resources.displayMetrics.density
        val top = max(this.insetsCompat.cutout.top, this.insetsCompat.statusBar.top)
        val bottom = this.insetsCompat.navigationBar.bottom
        val left = this.insetsCompat.statusBar.left
        val right = this.insetsCompat.statusBar.right

        return Insets(
            (top / density).toInt(),
            (bottom / density).toInt(),
            (left / density).toInt(),
            (right / density).toInt()
        )
    }

    private fun getStatusBarHeight(): Int {
        val density = reactApplicationContext.resources.displayMetrics.density

        return (this.insetsCompat.statusBar.top / density).toInt()
    }

    private fun getNavigationBarHeight(): Int {
        val density = reactApplicationContext.resources.displayMetrics.density

        return (this.insetsCompat.navigationBar.bottom / density).toInt()
    }
}
