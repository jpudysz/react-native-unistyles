package com.unistyles

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.graphics.Color
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.ViewTreeObserver
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule

class UnistylesModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext), LifecycleEventListener {
    private val drawHandler = Handler(Looper.getMainLooper())
    private val debounceDuration = 250L
    private var runnable: Runnable? = null

    private var isCxxReady: Boolean = false
    private lateinit var platform: Platform
    private val layoutListener = ViewTreeObserver.OnGlobalLayoutListener {
        if (this.isCxxReady) {
            runnable?.let { drawHandler.removeCallbacks(it) }

            runnable = Runnable {
                this@UnistylesModule.onLayoutConfigChange()
            }.also {
                drawHandler.postDelayed(it, debounceDuration)
            }
        }
    }

    private val configurationChangeReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            if (intent.action == Intent.ACTION_CONFIGURATION_CHANGED && this@UnistylesModule.isCxxReady) {
                Handler(Looper.getMainLooper()).postDelayed({
                    this@UnistylesModule.onConfigChange()
                }, 10)
            }
        }
    }

    override fun getName() = NAME
    companion object {
        const val NAME = "Unistyles"
    }

    //region Lifecycle
    init {
        reactApplicationContext.registerReceiver(configurationChangeReceiver, IntentFilter(Intent.ACTION_CONFIGURATION_CHANGED))
        reactApplicationContext.addLifecycleEventListener(this)
    }

    private fun setupLayoutListener() {
        val activity = currentActivity ?: return
        activity.window.decorView.rootView.viewTreeObserver.addOnGlobalLayoutListener(layoutListener)
    }

    private fun stopLayoutListener() {
        val activity = currentActivity ?: return
        activity.window.decorView.rootView.viewTreeObserver.removeOnGlobalLayoutListener(layoutListener)
    }

    @Deprecated("Deprecated in Java")
    override fun onCatalystInstanceDestroy() {
        this.stopLayoutListener()
        reactApplicationContext.unregisterReceiver(configurationChangeReceiver)
        runnable?.let { drawHandler.removeCallbacks(it) }
        reactApplicationContext.removeLifecycleEventListener(this)

        if (this.isCxxReady) {
            this.nativeDestroy()
        }
    }

    //endregion
    //region Event handlers
    private fun onConfigChange() {
        if (!platform.hasNewConfig()) {
            return
        }

        val config = platform.getConfig()

        reactApplicationContext.runOnJSQueueThread {
            if (config.hasNewColorScheme) {
                this.nativeOnAppearanceChange(config.colorScheme)
            }

            if (config.hasNewContentSizeCategory) {
                this.nativeOnContentSizeCategoryChange(config.contentSizeCategory)
            }
        }
    }

    private fun onLayoutConfigChange() {
        if (!platform.hasNewLayoutConfig()) {
            return
        }

        val config = platform.getLayoutConfig()

        reactApplicationContext.runOnJSQueueThread {
            this.nativeOnOrientationChange(
                config.screen,
                config.insets,
                config.statusBar,
                config.navigationBar
            )
        }
    }

    //endregion
    //region Core
    @ReactMethod(isBlockingSynchronousMethod = true)
    fun install(): Boolean {
        return try {
            System.loadLibrary("unistyles")

            this.platform = Platform(reactApplicationContext)

            val config = platform.getConfig()
            val layoutConfig = platform.getLayoutConfig()

            this.reactApplicationContext.javaScriptContextHolder?.let {
                this.nativeInstall(
                    it.get(),
                    layoutConfig.screen,
                    config.colorScheme,
                    config.contentSizeCategory,
                    layoutConfig.insets,
                    layoutConfig.statusBar,
                    layoutConfig.navigationBar
                )
                this.isCxxReady = true

                Log.i(NAME, "Installed Unistyles \uD83E\uDD84!")

                return true
            }

            false
        } catch (e: Exception) {
            this.isCxxReady = false

            return false
        }
    }

    private external fun nativeInstall(
        jsi: Long,
        screen: Dimensions,
        colorScheme: String,
        contentSizeCategory: String,
        insets: Insets,
        statusBar: Dimensions,
        navigationBar: Dimensions
    )
    private external fun nativeDestroy()
    private external fun nativeOnOrientationChange(screen: Dimensions, insets: Insets, statusBar: Dimensions, navigationBar: Dimensions)
    private external fun nativeOnAppearanceChange(colorScheme: String)
    private external fun nativeOnContentSizeCategoryChange(contentSizeCategory: String)

    //endregion
    //region Event emitter
    private fun onLayoutChange(breakpoint: String, orientation: String, screen: Dimensions, statusBar: Dimensions, insets: Insets, navigationBar: Dimensions) {
        val body = Arguments.createMap().apply {
            putString("type", "layout")
            putMap("payload", Arguments.createMap().apply {
                putString("breakpoint", breakpoint)
                putString("orientation", orientation)
                putMap("screen", Arguments.createMap().apply {
                    putInt("width", screen.width)
                    putInt("height", screen.height)
                })
                putMap("statusBar", Arguments.createMap().apply {
                    putInt("width", statusBar.width)
                    putInt("height", statusBar.height)
                })
                putMap("insets", Arguments.createMap().apply {
                    putInt("top", insets.top)
                    putInt("bottom", insets.bottom)
                    putInt("left", insets.left)
                    putInt("right", insets.right)
                })
                putMap("navigationBar", Arguments.createMap().apply {
                    putInt("width", navigationBar.width)
                    putInt("height", navigationBar.height)
                })
            })
        }

        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("__unistylesOnChange", body)
    }

    private fun onThemeChange(themeName: String) {
        val body = Arguments.createMap().apply {
            putString("type", "theme")
            putMap("payload", Arguments.createMap().apply {
                putString("themeName", themeName)
            })
        }

        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("__unistylesOnChange", body)
    }

    private fun onPluginChange() {
        val body = Arguments.createMap().apply {
            putString("type", "plugin")
        }

        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("__unistylesOnChange", body)
    }

    private fun onContentSizeCategoryChange(contentSizeCategory: String) {
        val body = Arguments.createMap().apply {
            putString("type", "dynamicTypeSize")
            putMap("payload", Arguments.createMap().apply {
                putString("contentSizeCategory", contentSizeCategory)
            })
        }

        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("__unistylesOnChange", body)
    }

    private fun onSetNavigationBarColor(color: String) {
        val activity = currentActivity ?: return

        if (platform.defaultNavigationBarColor == null) {
            platform.defaultNavigationBarColor = activity.window.navigationBarColor
        }

        try {
            activity.runOnUiThread {
                activity.window.navigationBarColor = if (color == "") platform.defaultNavigationBarColor!! else Color.parseColor(color)
            }
        } catch (_: Exception) {
            Log.d("Unistyles", "Failed to set navigation bar color: $color")
        }
    }

    private fun onSetStatusBarColor(color: String) {
        val activity = currentActivity ?: return

        if (platform.defaultStatusBarColor == null) {
            platform.defaultStatusBarColor = activity.window.statusBarColor
        }

        try {
            activity.runOnUiThread {
                activity.window.statusBarColor = if (color == "") platform.defaultStatusBarColor!! else Color.parseColor(color)
            }
        } catch (_: Exception) {
            Log.d("Unistyles", "Failed to set status bar color: $color")
        }
    }

    @ReactMethod
    fun addListener(eventName: String?) = Unit

    @ReactMethod
    fun removeListeners(count: Double) = Unit
    override fun onHostResume() {
        if (isCxxReady) {
            this.onConfigChange()
        }

        this.setupLayoutListener()
    }

    override fun onHostPause() {
        this.stopLayoutListener()
    }

    override fun onHostDestroy() {}
    //endregion
}
