package com.unistyles

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.res.Configuration
import android.os.Handler
import android.os.Looper
import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule


class UnistylesModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext), LifecycleEventListener {
    private val configurationChangeReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            if (intent.action == Intent.ACTION_CONFIGURATION_CHANGED) {
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

    override fun onCatalystInstanceDestroy() {
        reactApplicationContext.unregisterReceiver(configurationChangeReceiver)
        this.nativeDestroy()
    }

    //endregion
    //region Event handlers
    private fun onConfigChange() {
        val config = this.getConfig()

        reactApplicationContext.runOnJSQueueThread {
            this.nativeOnOrientationChange(
                config["width"] as Int,
                config["height"] as Int
            )
            this.nativeOnAppearanceChange(
                config["colorScheme"] as String
            )
            this.nativeOnContentSizeCategoryChange(config["contentSizeCategory"] as String)
        }
    }

    private fun getConfig(): Map<String, Any> {
        val displayMetrics = reactApplicationContext.resources.displayMetrics
        val colorScheme = when (reactApplicationContext.resources.configuration.uiMode.and(Configuration.UI_MODE_NIGHT_MASK)) {
            Configuration.UI_MODE_NIGHT_YES -> "dark"
            Configuration.UI_MODE_NIGHT_NO -> "light"
            else -> "unspecified"
        }
        val fontScale = reactApplicationContext.resources.configuration.fontScale
        val contentSizeCategory = when {
            fontScale <= 0.85f -> "Small"
            fontScale <= 1.0f -> "Default"
            fontScale <= 1.15f -> "Large"
            fontScale <= 1.3f -> "ExtraLarge"
            else -> "Huge"
        }

        return mapOf(
            "width" to (displayMetrics.widthPixels / displayMetrics.density).toInt(),
            "height" to (displayMetrics.heightPixels / displayMetrics.density).toInt(),
            "colorScheme" to colorScheme,
            "contentSizeCategory" to contentSizeCategory
        )
    }

    //endregion
    //region Core
    @ReactMethod(isBlockingSynchronousMethod = true)
    fun install(): Boolean {
        return try {
            System.loadLibrary("unistyles")
            val config = this.getConfig()

            this.reactApplicationContext.javaScriptContextHolder?.let {
                this.nativeInstall(
                    it.get(),
                    config["width"] as Int,
                    config["height"] as Int,
                    config["colorScheme"] as String,
                    config["contentSizeCategory"] as String
                )

                Log.i(NAME, "Installed Unistyles \uD83E\uDD84!")

                return true
            }

            false
        } catch (e: Exception) {
            false
        }
    }

    private external fun nativeInstall(jsi: Long, width: Int, height: Int, colorScheme: String, contentSizeCategory: String)
    private external fun nativeDestroy()
    private external fun nativeOnOrientationChange(width: Int, height: Int)
    private external fun nativeOnAppearanceChange(colorScheme: String)
    private external fun nativeOnContentSizeCategoryChange(contentSizeCategory: String)

    //endregion
    //region Event emitter
    private fun onLayoutChange(breakpoint: String, orientation: String, width: Int, height: Int) {
        val body = Arguments.createMap().apply {
            putString("type", "layout")
            putMap("payload", Arguments.createMap().apply {
                putString("breakpoint", breakpoint)
                putString("orientation", orientation)
                putMap("screen", Arguments.createMap().apply {
                    putInt("width", width)
                    putInt("height", height)
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
    }

    override fun onHostPause() {}

    override fun onHostDestroy() {}
    //endregion
}
