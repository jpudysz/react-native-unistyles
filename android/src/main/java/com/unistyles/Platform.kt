package com.unistyles

import android.content.res.Configuration
import android.graphics.Color
import android.graphics.Rect
import android.os.Build
import android.util.Log
import android.view.View
import android.view.Window
import android.view.WindowManager
import androidx.core.graphics.ColorUtils
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.facebook.react.bridge.ReactApplicationContext
import kotlin.math.roundToInt

class Platform(private val reactApplicationContext: ReactApplicationContext) {
    private var insets: Insets = Insets(0, 0, 0, 0)
    private var defaultNavigationBarColor: Int = -1
    private var defaultStatusBarColor: Int = -1

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

    fun onSetNavigationBarColor(color: String, alpha: Float) {
        this.reactApplicationContext.currentActivity?.let { activity ->
            if (this.defaultNavigationBarColor == -1) {
                this.defaultNavigationBarColor = activity.window.navigationBarColor
            }

            try {
                activity.runOnUiThread {
                    activity.window.navigationBarColor = parseColor(color, alpha, this.defaultNavigationBarColor)
                }
            } catch (_: Exception) {
                Log.d("Unistyles", "Failed to set navigation bar color: $color")
            }
        }
    }

    fun onSetNavigationBarHidden(isHidden: Boolean) {
        this.reactApplicationContext.currentActivity?.let { activity ->
            WindowInsetsControllerCompat(activity.window, activity.window.decorView).apply {
                activity.window?.decorView?.let { decorView ->
                    @Suppress("DEPRECATION")
                    activity.runOnUiThread {
                        if (isHidden) {
                            // below Android 11, we need to use window flags to hide the navigation bar
                            if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.Q) {
                                decorView.systemUiVisibility = (View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                                    or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY)
                            } else {
                                hide(WindowInsetsCompat.Type.navigationBars())
                                systemBarsBehavior =
                                    WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
                            }

                            // dispatch new insets to invoke the insets listener
                            val newInsets = WindowInsetsCompat.Builder()
                                .setInsets(WindowInsetsCompat.Type.navigationBars(), androidx.core.graphics.Insets.of(0, 0, 0, 0))
                                .build()

                            ViewCompat.dispatchApplyWindowInsets(activity.findViewById(android.R.id.content), newInsets)
                        } else {
                            show(WindowInsetsCompat.Type.navigationBars())
                        }
                    }
                }
            }
        }
    }

    fun onSetStatusBarHidden(isHidden: Boolean) {
        this.reactApplicationContext.currentActivity?.let { activity ->
            WindowInsetsControllerCompat(activity.window, activity.window.decorView).apply {
                activity.window?.let { window ->
                    @Suppress("DEPRECATION")
                    activity.runOnUiThread {
                        if (isHidden) {
                            if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.Q) {
                                window.addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN)
                                window.clearFlags(WindowManager.LayoutParams.FLAG_FORCE_NOT_FULLSCREEN)
                            } else {
                                hide(WindowInsetsCompat.Type.statusBars())
                            }
                        } else {
                            show(WindowInsetsCompat.Type.statusBars())
                        }
                    }
                }
            }
        }
    }

    fun onSetStatusBarColor(color: String, alpha: Float) {
        this.reactApplicationContext.currentActivity?.let { activity ->
            if (this.defaultStatusBarColor == -1) {
                this.defaultStatusBarColor = activity.window.statusBarColor
            }

            try {
                activity.runOnUiThread {
                    activity.window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS)
                    activity.window.statusBarColor = parseColor(color, alpha, this.defaultStatusBarColor)
                }
            } catch (_: Exception) {
                Log.d("Unistyles", "Failed to set status bar color: $color")
            }
        }
    }

    fun onSetImmersiveMode(isEnabled: Boolean) {
        this.onSetStatusBarHidden(isEnabled)
        this.onSetNavigationBarHidden(isEnabled)
    }

    fun onSetRootViewBackgroundColor(color: String, alpha: Float) {
        this.reactApplicationContext.currentActivity?.let { activity ->
            activity.window?.decorView?.let { decorView ->
                try {
                    activity.runOnUiThread {
                        decorView.rootView.setBackgroundColor(parseColor(color, alpha, Color.WHITE))
                    }
                } catch (_: Exception) {
                    Log.d("Unistyles", "Failed to set root view background color: $color")
                }
            }
        }
    }

    private fun parseColor(color: String, alpha: Float, defaultColor: Int): Int {
        if (color == "") {
            return defaultColor
        }

        if (color == "transparent") {
            return Color.TRANSPARENT
        }

        if (alpha == 1.toFloat()) {
            return Color.parseColor(color)
        }

        return ColorUtils.setAlphaComponent(Color.parseColor(color), (255 * alpha).toInt())
    }
}
