package com.unistyles

import android.os.Build
import android.content.Context
import android.content.res.Configuration
import android.content.res.Resources
import android.os.Handler
import android.os.Looper
import android.util.DisplayMetrics
import android.view.View
import android.view.Window
import android.view.WindowManager
import androidx.annotation.Keep
import androidx.core.content.OnConfigurationChangedProvider
import androidx.core.util.Consumer
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.modules.i18nmanager.I18nUtil
import com.margelo.nitro.unistyles.ColorScheme
import com.margelo.nitro.unistyles.Dimensions
import com.margelo.nitro.unistyles.HybridNativePlatformSpec
import com.margelo.nitro.unistyles.Insets
import com.margelo.nitro.unistyles.Orientation
import com.margelo.nitro.unistyles.UnistyleDependency
import com.margelo.nitro.unistyles.UnistylesNativeMiniRuntime
import java.lang.ref.WeakReference

@Keep
@DoNotStrip
class NativePlatformAndroid(private val reactContext: ReactApplicationContext): HybridNativePlatformSpec(), LifecycleEventListener {
    private val _insets = NativePlatformInsets(reactContext, this::getMiniRuntime, this::onImeChange) { this.onConfigChange() }
    @Volatile
    private var _miniRuntime: UnistylesNativeMiniRuntime = buildMiniRuntime()
    private val _listener = NativePlatformListener(reactContext, this::getMiniRuntime) { this.diffMiniRuntime() }
    private var _configurationProvider: WeakReference<OnConfigurationChangedProvider>? = null
    private val _activityConfigurationListener = Consumer<Configuration> {
        Handler(Looper.getMainLooper()).post { this.onConfigChange() }
    }
    // windows created on top of the Activity, e.g. Modal's Dialog (React Native 0.86+)
    private val _extraWindows: MutableList<Window> = mutableListOf()
    private val _extraWindowsObserver = NativePlatformExtraWindows(reactContext, this::onExtraWindowCreate, this::onExtraWindowDestroy)

    // Application resources can lag behind configuration changes
    private val configurationResources: Resources
        get() = reactContext.currentActivity?.resources ?: reactContext.resources

    init {
        checkEdgeToEdge()
        reactContext.addLifecycleEventListener(this)
        _extraWindowsObserver.startObserving()
    }

    fun onDestroy() {
        _extraWindowsObserver.stopObserving()
        _extraWindows.clear()
        stopObservingActivityConfiguration()
        _listener.onDestroy()
        _insets.onDestroy()
        reactContext.removeLifecycleEventListener(this)
    }

    override fun onHostResume() {
        observeActivityConfiguration()
        // catch configuration changes missed while no Activity was attached
        onConfigChange()
        _insets.getInitialInsets(false)
        _insets.startInsetsListener()
    }

    override fun onHostPause() {
        _insets.stopInsetsListener()
    }

    override fun onHostDestroy() {
        stopObservingActivityConfiguration()
    }

    private fun observeActivityConfiguration() {
        val provider = reactContext.currentActivity as? OnConfigurationChangedProvider

        if (_configurationProvider?.get() === provider) {
            return
        }

        stopObservingActivityConfiguration()
        provider?.addOnConfigurationChangedListener(_activityConfigurationListener)
        _configurationProvider = provider?.let { WeakReference(it) }
    }

    private fun stopObservingActivityConfiguration() {
        _configurationProvider?.get()?.removeOnConfigurationChangedListener(_activityConfigurationListener)
        _configurationProvider = null
    }

    private fun onExtraWindowCreate(window: Window) {
        _extraWindows.add(window)
        _insets.attachToExtraWindow(window)
    }

    private fun onExtraWindowDestroy(window: Window) {
        _extraWindows.remove(window)
        _insets.detachFromExtraWindow(window)
    }

    override val memorySize: Long
        get() = 0

    override fun getInsets(): Insets {
        return _insets.getInsets()
    }

    override fun getColorScheme(): ColorScheme {
        val uiMode = configurationResources.configuration.uiMode

        val colorScheme = when (uiMode.and(Configuration.UI_MODE_NIGHT_MASK)) {
            Configuration.UI_MODE_NIGHT_YES -> ColorScheme.DARK
            Configuration.UI_MODE_NIGHT_NO -> ColorScheme.LIGHT
            else -> ColorScheme.UNSPECIFIED
        }

        return colorScheme
    }

    override fun getFontScale(): Double {
        return configurationResources.configuration.fontScale.toDouble()
    }

    override fun getPixelRatio(): Double {
        return configurationResources.displayMetrics.density.toDouble()
    }

    override fun getOrientation(): Orientation {
        val orientation = when (configurationResources.configuration.orientation) {
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
                val displayMetrics = configurationResources.displayMetrics

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
        return I18nUtil.instance.isRTL(reactContext.currentActivity ?: reactContext)
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
            activity.window?.let { window ->
                activity.runOnUiThread {
                    setNavigationBarHidden(window, isHidden)

                    if (isHidden) {
                        // dispatch new insets to invoke the insets listener
                        val newInsets = WindowInsetsCompat.Builder()
                            .setInsets(WindowInsetsCompat.Type.navigationBars(), androidx.core.graphics.Insets.of(0, 0, 0, 0))
                            .build()

                        ViewCompat.dispatchApplyWindowInsets(activity.findViewById(android.R.id.content), newInsets)
                    }

                    // otherwise opened Modals would keep the previous state
                    _extraWindows.forEach { extraWindow ->
                        setNavigationBarHidden(extraWindow, isHidden)
                    }
                }
            }
        }
    }

    @Suppress("DEPRECATION")
    private fun setNavigationBarHidden(window: Window, isHidden: Boolean) {
        WindowInsetsControllerCompat(window, window.decorView).apply {
            if (isHidden) {
                // below Android 11, we need to use window flags to hide the navigation bar
                if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.Q) {
                    window.decorView.systemUiVisibility = (View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                        or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY)
                } else {
                    hide(WindowInsetsCompat.Type.navigationBars())
                    systemBarsBehavior =
                        WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
                }
            } else {
                show(WindowInsetsCompat.Type.navigationBars())
            }
        }
    }

    override fun setStatusBarHidden(isHidden: Boolean) {
        reactContext.currentActivity?.let { activity ->
            activity.window?.let { window ->
                activity.runOnUiThread {
                    setStatusBarHidden(window, isHidden)

                    // otherwise opened Modals would keep the previous state
                    _extraWindows.forEach { extraWindow ->
                        setStatusBarHidden(extraWindow, isHidden)
                    }
                }
            }
        }
    }

    @Suppress("DEPRECATION")
    private fun setStatusBarHidden(window: Window, isHidden: Boolean) {
        WindowInsetsControllerCompat(window, window.decorView).apply {
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

    private fun onConfigChange() {
        this._listener.onConfigChange()
    }

    // only the IME, other insets are diffed by onConfigChange
    private fun onImeChange(ime: Double) {
        this._miniRuntime = this._miniRuntime.copy(insets = this._miniRuntime.insets.copy(ime = ime))
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
            return
        } catch (_: ClassNotFoundException) {}

        // React Native's edgeToEdgeEnabled gradle property (or other mechanism)
        // may have already enabled edge-to-edge before Unistyles initializes
        if (isEdgeToEdgeAlreadyEnabled()) {
            return
        }

        enableEdgeToEdge()
    }

    @Suppress("DEPRECATION")
    private fun isEdgeToEdgeAlreadyEnabled(): Boolean {
        val activity = reactContext.currentActivity ?: return false

        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            !activity.window.decorView.fitsSystemWindows
        } else {
            val flags = activity.window.decorView.systemUiVisibility
            (flags and View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION) != 0
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
