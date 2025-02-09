package com.unistyles

import android.content.Context
import android.content.res.Configuration
import android.os.Build
import android.util.DisplayMetrics
import android.view.View
import android.view.WindowManager
import androidx.annotation.Keep
import androidx.core.text.TextUtilsCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.ReactApplicationContext
import com.margelo.nitro.unistyles.ColorScheme
import com.margelo.nitro.unistyles.Dimensions
import com.margelo.nitro.unistyles.HybridNativePlatformSpec
import com.margelo.nitro.unistyles.Insets
import com.margelo.nitro.unistyles.Orientation
import com.margelo.nitro.unistyles.UnistyleDependency
import com.margelo.nitro.unistyles.UnistylesNativeMiniRuntime
import java.util.Locale

@Keep
@DoNotStrip
class NativePlatformAndroid(private val reactContext: ReactApplicationContext): HybridNativePlatformSpec(), LifecycleEventListener {
    private val _insets = NativePlatformInsets(reactContext, this::getMiniRuntime) { this.diffMiniRuntime() }
    private var _miniRuntime: UnistylesNativeMiniRuntime = buildMiniRuntime()
    private val _listener = NativePlatformListener(reactContext, this::getMiniRuntime) { this.diffMiniRuntime() }

    init {
        checkEdgeToEdge()
        reactContext.addLifecycleEventListener(this)
    }

    fun onDestroy() {
        reactContext.removeLifecycleEventListener(this)
    }

    override fun onHostResume() {
        _insets.startInsetsListener()
    }

    override fun onHostPause() {
        _insets.stopInsetsListener()
    }

    override fun onHostDestroy() {}

    override val memorySize: Long
        get() = 0

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
        val fontScale = getFontScale()

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

                @Suppress("DEPRECATION")
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
        val screenWidth = getScreenDimensions().width

        return Dimensions(screenWidth, _insets.getInsets().top)
    }

    override fun getNavigationBarDimensions(): Dimensions {
        val screenWidth = getScreenDimensions().width

        return Dimensions(screenWidth, _insets.getInsets().bottom)
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
        reactContext.currentActivity?.let { activity ->
            activity.window?.decorView?.let { decorView ->
                activity.runOnUiThread {
                    decorView.rootView.setBackgroundColor(color.toInt())
                }
            }
        }
    }

    override fun setNavigationBarHidden(isHidden: Boolean) {
        reactContext.currentActivity?.let { activity ->
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

    override fun setStatusBarHidden(isHidden: Boolean) {
        reactContext.currentActivity?.let { activity ->
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

    override fun setImmersiveMode(isEnabled: Boolean) {
        this.setStatusBarHidden(isEnabled)
        this.setNavigationBarHidden(isEnabled)
    }

    override fun getMiniRuntime(): UnistylesNativeMiniRuntime {
        return _miniRuntime
    }

    private fun buildMiniRuntime(): UnistylesNativeMiniRuntime {
        val orientation = this.getOrientation()

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
            isPortrait = orientation == Orientation.PORTRAIT,
            isLandscape = orientation == Orientation.LANDSCAPE
        )
    }

    private fun diffMiniRuntime(): Array<UnistyleDependency> {
        val newMiniRuntime = this.buildMiniRuntime()
        val changedDependencies = diffMiniRuntimes(this._miniRuntime, newMiniRuntime)

        if (changedDependencies.isNotEmpty()) {
            this._miniRuntime = newMiniRuntime
        }

        return changedDependencies
    }

    override fun registerPlatformListener(callback: (dependencies: Array<UnistyleDependency>, miniRuntime: UnistylesNativeMiniRuntime) -> Unit) {
        this._listener.addPlatformListener(callback)
    }

    override fun registerImeListener(callback: (miniRuntime: UnistylesNativeMiniRuntime) -> Unit) {
        this._insets.addImeListener(callback)
    }

    override fun unregisterPlatformListeners() {
        this._listener.removePlatformListeners()
        this._insets.removeImeListeners()
    }

    private fun checkEdgeToEdge() {
        // react-native-edge-to-edge will set setDecorFitsSystemWindows automatically
        // if it's present we assume that edge-to-edge is enabled

        try {
            Class.forName("com.zoontek.rnedgetoedge.EdgeToEdgePackage")
        } catch (exception: ClassNotFoundException) {
            enableEdgeToEdge()
        }
    }

    private fun enableEdgeToEdge() {
        reactContext.currentActivity?.let { activity ->
            activity.runOnUiThread {
                WindowCompat.setDecorFitsSystemWindows(activity.window, false)
            }
        }
    }
}
