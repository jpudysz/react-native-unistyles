package com.unistyles

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.View
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.turbomodule.core.interfaces.CallInvokerHolder

class UnistylesModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext), LifecycleEventListener {
    private var isCxxReady: Boolean = false
    private lateinit var platform: Platform

    private val configurationChangeReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            if (!this@UnistylesModule.isCxxReady) {
                return
            }

            if (intent.action == Intent.ACTION_CONFIGURATION_CHANGED) {
                Handler(Looper.getMainLooper()).postDelayed({
                    this@UnistylesModule.onConfigChange()
                }, 10)
            }

            val newConfig = context.resources.configuration

            if (newConfig.orientation != platform.orientation) {
                platform.orientation = newConfig.orientation

                this@UnistylesModule.onLayoutConfigChange()
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

    override fun invalidate() {
        reactApplicationContext.unregisterReceiver(configurationChangeReceiver)
        reactApplicationContext.removeLifecycleEventListener(this)

        if (this.isCxxReady) {
            this.nativeDestroy()
        }
    }

    //endregion
    //region Event handlers
    private fun onConfigChange() {
        val colorScheme = this.platform.getColorScheme()
        val contentSizeCategory = this.platform.getContentSizeCategory()

        reactApplicationContext.runOnJSQueueThread {
            this.nativeOnAppearanceChange(colorScheme)
            this.nativeOnContentSizeCategoryChange(contentSizeCategory)
        }
    }

    private fun onLayoutConfigChange() {
        val screen = this.platform.getScreenDimensions()
        val insets = this.platform.getInsets()
        val statusBar = this.platform.getStatusBarDimensions()
        val navigationBar = this.platform.getNavigationBarDimensions()

        reactApplicationContext.runOnJSQueueThread {
            this.nativeOnOrientationChange(
                screen,
                insets,
                statusBar,
                navigationBar
            )
        }
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    fun install(): Boolean {
        return try {
            System.loadLibrary("unistyles")

            this.platform = Platform(reactApplicationContext)
            this.enableEdgeToEdge()

            this.reactApplicationContext.javaScriptContextHolder?.let { contextHolder ->
                this.reactApplicationContext.catalystInstance.jsCallInvokerHolder?.let { callInvokerHolder: CallInvokerHolder ->
                    this.nativeInstall(contextHolder.get(), callInvokerHolder)
                    this.isCxxReady = true

                    Log.i(NAME, "Installed Unistyles \uD83E\uDD84!")

                    return true
                }
            }

            false
        } catch (e: Exception) {
            this.isCxxReady = false

            return false
        }
    }

    private external fun nativeInstall(jsi: Long, callInvoker: CallInvokerHolder)
    private external fun nativeDestroy()
    private external fun nativeOnOrientationChange(screen: Screen, insets: Insets, statusBar: Dimensions, navigationBar: Dimensions)
    private external fun nativeOnAppearanceChange(colorScheme: String)
    private external fun nativeOnContentSizeCategoryChange(contentSizeCategory: String)

    private fun enableEdgeToEdge() {
        this.reactApplicationContext.currentActivity?.let { activity ->
            activity.runOnUiThread {
                WindowCompat.setDecorFitsSystemWindows(activity.window, false)
            }
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

        this.reactApplicationContext.currentActivity?.let { activity ->
            activity.findViewById<View>(android.R.id.content)?.let { mainView ->
                ViewCompat.setOnApplyWindowInsetsListener(mainView) { _, insets ->
                    this.platform.setInsetsCompat(insets, activity.window)

                    if (this.isCxxReady) {
                        this.onLayoutConfigChange()
                    }

                    insets
                }
            }
        }
    }

    override fun onHostPause() {
        this.reactApplicationContext.currentActivity?.let { activity ->
            activity.window?.decorView?.let { view ->
                ViewCompat.setOnApplyWindowInsetsListener(view, null)
            }
        }
    }

    override fun onHostDestroy() {}
}
