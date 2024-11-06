package com.unistyles

import UnistylesModuleInsets
import android.content.Context
import android.content.res.Configuration
import android.os.Build
import android.util.DisplayMetrics
import android.view.WindowManager
import androidx.core.text.TextUtilsCompat
import androidx.core.view.ViewCompat
import com.facebook.react.bridge.ReactApplicationContext
import com.margelo.nitro.unistyles.ColorScheme
import com.margelo.nitro.unistyles.Dimensions
import com.margelo.nitro.unistyles.HybridNativePlatformSpec
import com.margelo.nitro.unistyles.Insets
import com.margelo.nitro.unistyles.Orientation
import com.margelo.nitro.unistyles.UnistyleDependency
import com.margelo.nitro.unistyles.UnistylesNativeMiniRuntime
import java.util.Locale

class NativePlatform(private val reactContext: ReactApplicationContext): HybridNativePlatformSpec() {
    private val _insets = UnistylesModuleInsets(reactContext)

    override fun getInsets(): Insets {
        return _insets.getInsets()
    }

    override fun getColorScheme(): ColorScheme {
        val uiMode = reactContext.resources.configuration.uiMode

        val colorScheme = when (uiMode.and(Configuration.UI_MODE_NIGHT_MASK)) {
            Configuration.UI_MODE_NIGHT_YES -> ColorScheme.DARK
            Configuration.UI_MODE_NIGHT_NO -> ColorScheme.LIGHT
            else -> ColorScheme.UNSPECIFIED
        }

        return colorScheme
    }

    override fun getFontScale(): Double {
        return reactContext.resources.configuration.fontScale.toDouble()
    }

    override fun getPixelRatio(): Double {
        return reactContext.resources.displayMetrics.density.toDouble()
    }

    override fun getOrientation(): Orientation {
        val orientation = when (reactContext.resources.configuration.orientation) {
            Configuration.ORIENTATION_PORTRAIT -> Orientation.PORTRAIT
            Configuration.ORIENTATION_LANDSCAPE -> Orientation.LANDSCAPE
            else -> Orientation.PORTRAIT
        }

        return orientation
    }

    override fun getContentSizeCategory(): String {
        val fontScale = reactContext.resources.configuration.fontScale

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

    override fun getScreenDimensions(): Dimensions {
        // function takes in count edge-to-edge layout
        when {
            Build.VERSION.SDK_INT < Build.VERSION_CODES.R -> {
                val windowManager = reactContext.getSystemService(Context.WINDOW_SERVICE) as WindowManager
                val metrics = DisplayMetrics()

                windowManager.defaultDisplay.getRealMetrics(metrics)

                val screenWidth = (metrics.widthPixels / metrics.density).toDouble()
                val screenHeight = (metrics.heightPixels / metrics.density).toDouble()

                return Dimensions(screenWidth, screenHeight)
            }
            else -> {
                val displayMetrics = reactContext.resources.displayMetrics

                reactContext.currentActivity?.windowManager?.currentWindowMetrics?.bounds?.let {
                    val boundsWidth = (it.width() / displayMetrics.density).toDouble()
                    val boundsHeight = (it.height() / displayMetrics.density).toDouble()

                    return Dimensions(boundsWidth, boundsHeight)
                } ?: run {
                    val screenWidth = (displayMetrics.widthPixels / displayMetrics.density).toDouble()
                    val screenHeight = (displayMetrics.heightPixels / displayMetrics.density).toDouble()

                    return Dimensions(screenWidth, screenHeight)
                }
            }
        }
    }

    override fun getStatusBarDimensions(): Dimensions {
        // todo
        return Dimensions(0.0, 0.0)
    }

    override fun getNavigationBarDimensions(): Dimensions {
        // todo
        return Dimensions(0.0, 0.0)
    }

    override fun getPrefersRtlDirection(): Boolean {
        // forced by React Native
        val sharedPrefs = reactContext.getSharedPreferences(
            "com.facebook.react.modules.i18nmanager.I18nUtil",
            Context.MODE_PRIVATE
        )
        val hasForcedRtl = sharedPrefs.getBoolean("RCTI18nUtil_forceRTL", false)
        // user preferences
        val isRtl = TextUtilsCompat.getLayoutDirectionFromLocale(Locale.getDefault()) == ViewCompat.LAYOUT_DIRECTION_RTL

        return hasForcedRtl || isRtl
    }

    override fun setRootViewBackgroundColor(color: Double) {
        // todo
    }

    override fun setNavigationBarBackgroundColor(color: Double) {
        // todo
    }

    override fun setNavigationBarHidden(isHidden: Boolean) {
        // todo
    }

    override fun setStatusBarHidden(isHidden: Boolean) {
        // todo
    }

    override fun setStatusBarBackgroundColor(color: Double) {
        // todo
    }

    override fun setImmersiveMode(isEnabled: Boolean) {
        this.setStatusBarHidden(isEnabled)
        this.setNavigationBarHidden(isEnabled)
    }

    override fun getMiniRuntime(): UnistylesNativeMiniRuntime {
        return UnistylesNativeMiniRuntime(
            colorScheme = this.getColorScheme(),
            screen = this.getScreenDimensions(),
            contentSizeCategory = this.getContentSizeCategory(),
            insets = this.getInsets(),
            pixelRatio = this.getPixelRatio(),
            fontScale = this.getFontScale(),
            rtl = this.getPrefersRtlDirection(),
            statusBar = this.getStatusBarDimensions(),
            navigationBar = this.getNavigationBarDimensions(),
            isPortrait = this.getOrientation() == Orientation.PORTRAIT,
            isLandscape = this.getOrientation() == Orientation.LANDSCAPE
        )
    }

    override fun registerPlatformListener(callback: (dependencies: Array<UnistyleDependency>) -> Unit) {
        // todo
    }

    override fun registerImeListener(callback: () -> Unit) {
        // todo
    }

    override fun unregisterPlatformListeners() {
        // todo
    }

    override val memorySize: Long
        get() = 0
}
