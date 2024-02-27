package com.unistyles

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
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
    private val platform: Platform = Platform(reactContext)
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
    }

    private fun setupLayoutListener() {
        val activity = currentActivity ?: return
        activity.window.decorView.rootView.viewTreeObserver.addOnGlobalLayoutListener(layoutListener)
    }

    @Deprecated("Deprecated in Java")
    override fun onCatalystInstanceDestroy() {
        val activity = currentActivity ?: return

        activity.window.decorView.rootView.viewTreeObserver.removeOnGlobalLayoutListener(layoutListener)
        reactApplicationContext.unregisterReceiver(configurationChangeReceiver)
        runnable?.let { drawHandler.removeCallbacks(it) }
        this.nativeDestroy()
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
            val config = platform.getConfig()
            val layoutConfig = platform.getLayoutConfig()

            this.setupLayoutListener()
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
            false
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

    @ReactMethod
    fun addListener(eventName: String?) = Unit

    @ReactMethod
    fun removeListeners(count: Double) = Unit
    override fun onHostResume() {
        this.onConfigChange()
        this.onLayoutConfigChange()
    }

    override fun onHostPause() {}

    override fun onHostDestroy() {}
    //endregion
}
