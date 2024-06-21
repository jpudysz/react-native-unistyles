package com.unistyles

import android.content.res.Configuration
import android.graphics.Rect
import android.os.Build
import android.view.Window
import android.view.WindowManager
import androidx.core.view.WindowInsetsCompat
import com.facebook.react.bridge.ReactApplicationContext
import kotlin.math.roundToInt

class Platform(private val reactApplicationContext: ReactApplicationContext) {
    private var insets: Insets = Insets(0, 0, 0, 0)

    var defaultNavigationBarColor: Int? = null
    var defaultStatusBarColor: Int? = null
    var orientation: Int = reactApplicationContext.resources.configuration.orientation

    fun getScreenDimensions(): Screen {
        val displayMetrics = reactApplicationContext.resources.displayMetrics
        val fontScale = reactApplicationContext.resources.configuration.fontScale
        val screenWidth = (displayMetrics.widthPixels / displayMetrics.density).roundToInt()
        val screenHeight = (displayMetrics.heightPixels / displayMetrics.density).roundToInt()

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
        val screenWidth = (displayMetrics.widthPixels / displayMetrics.density).roundToInt()

        return Dimensions(screenWidth, getStatusBarHeight())
    }

    fun getNavigationBarDimensions(): Dimensions {
        val displayMetrics = reactApplicationContext.resources.displayMetrics
        val screenWidth = (displayMetrics.widthPixels / displayMetrics.density).roundToInt()

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

    fun setInsetsCompat(insetsCompat: WindowInsetsCompat, window: Window) {
        // below Android 11, we need to use window flags to detect status bar visibility
        val isStatusBarVisible = when(Build.VERSION.SDK_INT) {
            in 30..Int.MAX_VALUE -> {
                insetsCompat.isVisible(WindowInsetsCompat.Type.statusBars())
            }
            else -> {
                @Suppress("DEPRECATION")
                window.attributes.flags and WindowManager.LayoutParams.FLAG_FULLSCREEN != WindowManager.LayoutParams.FLAG_FULLSCREEN
            }
        }
        // React Native is forcing insets to make status bar translucent
        // so we need to calculate top inset manually, as WindowInsetCompat will always return 0
        val statusBarTopInset = when(isStatusBarVisible) {
            true -> {
                val visibleRect = Rect()

                window.decorView.getWindowVisibleDisplayFrame(visibleRect)

                visibleRect.top
            }
            false -> 0
        }

        val insets = insetsCompat.getInsets(WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout())

        this.insets = Insets(statusBarTopInset, insets.bottom, insets.left, insets.right)
    }
    fun getInsets(): Insets {
        val density = reactApplicationContext.resources.displayMetrics.density

        return Insets(
            (this.insets.top / density).roundToInt(),
            (this.insets.bottom / density).roundToInt(),
            (this.insets.left / density).roundToInt(),
            (this.insets.right / density).roundToInt()
        )
    }

    private fun getStatusBarHeight(): Int {
        val density = reactApplicationContext.resources.displayMetrics.density

        return (this.insets.top / density).roundToInt()
    }

    private fun getNavigationBarHeight(): Int {
        val density = reactApplicationContext.resources.displayMetrics.density

        return (this.insets.bottom / density).roundToInt()
    }
}
