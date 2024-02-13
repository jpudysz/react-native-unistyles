package com.unistyles

import android.annotation.SuppressLint
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.res.Configuration
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.WindowInsets
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.facebook.react.uimanager.PixelUtil


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
    @Suppress("UNCHECKED_CAST")
    private fun onConfigChange() {
        val config = this.getConfig()

        reactApplicationContext.runOnJSQueueThread {
            this.nativeOnOrientationChange(
                config["width"] as Int,
                config["height"] as Int,
                config["insets"] as Map<String, Int>,
                config["statusBar"] as Map<String, Int>
            )
            this.nativeOnAppearanceChange(
                config["colorScheme"] as String
            )
            this.nativeOnContentSizeCategoryChange(config["contentSizeCategory"] as String)
        }
    }

    @SuppressLint("InternalInsetResource", "DiscouragedApi", "ObsoleteSdkInt")
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
        val screenWidth = (displayMetrics.widthPixels / displayMetrics.density).toInt()
        val screenHeight = (displayMetrics.heightPixels / displayMetrics.density).toInt()

        return mapOf(
            "width" to screenWidth,
            "height" to screenHeight,
            "colorScheme" to colorScheme,
            "contentSizeCategory" to contentSizeCategory,
            "insets" to getScreenInsets(),
            "statusBar" to mapOf(
                "height" to getStatusBarHeight(),
                "width" to screenWidth
            )
        )
    }

    @Suppress("DEPRECATION")
    private fun getScreenInsets(): Map<String, Int> {
        val insets = mutableMapOf(
            "top" to 0,
            "bottom" to 0,
            "left" to 0,
            "right" to 0
        )

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            val systemInsets = reactApplicationContext.currentActivity?.window?.decorView?.rootWindowInsets?.getInsetsIgnoringVisibility(WindowInsets.Type.displayCutout())

            insets["top"] = PixelUtil.toDIPFromPixel(systemInsets?.top?.toFloat() ?: 0F).toInt()
            insets["bottom"] = PixelUtil.toDIPFromPixel(systemInsets?.bottom?.toFloat() ?: 0F).toInt()
            insets["left"] = PixelUtil.toDIPFromPixel(systemInsets?.left?.toFloat() ?: 0F).toInt()
            insets["right"] = PixelUtil.toDIPFromPixel(systemInsets?.right?.toFloat() ?: 0F).toInt()

            return insets
        }

        val systemInsets = reactApplicationContext.currentActivity?.window?.decorView?.rootWindowInsets

        insets["top"] = PixelUtil.toDIPFromPixel(systemInsets?.systemWindowInsetTop?.toFloat() ?: 0F).toInt()
        insets["bottom"] = PixelUtil.toDIPFromPixel(systemInsets?.systemWindowInsetBottom?.toFloat() ?: 0F).toInt()
        insets["left"] = PixelUtil.toDIPFromPixel(systemInsets?.systemWindowInsetLeft?.toFloat() ?: 0F).toInt()
        insets["right"] = PixelUtil.toDIPFromPixel(systemInsets?.systemWindowInsetRight?.toFloat() ?: 0F).toInt()

        return insets
    }

    @SuppressLint("InternalInsetResource", "DiscouragedApi")
    private fun getStatusBarHeight(): Int {
        val heightResId = reactApplicationContext.resources.getIdentifier("status_bar_height", "dimen", "android")

        if (heightResId > 0) {
            return PixelUtil.toDIPFromPixel(reactApplicationContext.resources.getDimensionPixelSize(heightResId).toFloat()).toInt()
        }

        return 0
    }

    //endregion
    //region Core
    @Suppress("UNCHECKED_CAST")
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
                    config["contentSizeCategory"] as String,
                    config["insets"] as Map<String, Int>,
                    config["statusBar"] as Map<String, Int>
                )

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
        width: Int,
        height: Int,
        colorScheme: String,
        contentSizeCategory: String,
        insets: Map<String, Int>,
        statusBar: Map<String, Int>
    )
    private external fun nativeDestroy()
    private external fun nativeOnOrientationChange(width: Int, height: Int, insets: Map<String, Int>, statusBar: Map<String, Int>)
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
