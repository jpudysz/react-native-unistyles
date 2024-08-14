package com.unistyles

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.View
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsAnimationCompat
import androidx.core.view.WindowInsetsCompat
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.turbomodule.core.interfaces.CallInvokerHolder
import kotlin.math.roundToInt

class UnistylesModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext), LifecycleEventListener {
    private var isCxxReady: Boolean = false
    private var platform: Platform = Platform(reactContext)

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
        this.enableEdgeToEdge()

        if (isCxxReady) {
            this.onConfigChange()
        }

        this.reactApplicationContext.currentActivity?.let { activity ->
            activity.findViewById<View>(android.R.id.content)?.let { mainView ->
                ViewCompat.setOnApplyWindowInsetsListener(mainView) { _, insets ->
                    this.platform.setInsetsCompat(insets, activity.window, null)

                    if (this.isCxxReady) {
                        this.onLayoutConfigChange()
                    }

                    insets
                }

                if (Build.VERSION.SDK_INT >= 30) {
                    ViewCompat.setWindowInsetsAnimationCallback(
                        mainView,
                        object : WindowInsetsAnimationCompat.Callback(DISPATCH_MODE_STOP) {
                            var initialBottomInsets = 0
                            var isGoingUp = false

                            override fun onPrepare(animation: WindowInsetsAnimationCompat) {
                                val insets = ViewCompat.getRootWindowInsets(mainView)
                                val isKeyboardVisible = insets?.isVisible(WindowInsetsCompat.Type.ime()) ?: false

                                if (!isKeyboardVisible) {
                                    val density = reactApplicationContext.resources.displayMetrics.density

                                    initialBottomInsets = (this@UnistylesModule.platform.getInsets().bottom * density).roundToInt()
                                }

                                isGoingUp = !isKeyboardVisible
                            }

                            override fun onProgress(
                                insets: WindowInsetsCompat,
                                runningAnimations: List<WindowInsetsAnimationCompat>
                            ): WindowInsetsCompat {
                                runningAnimations.firstOrNull()?.let { animation ->
                                    val progress = animation.fraction
                                    val nextBottomInset = if (isGoingUp) {
                                        (initialBottomInsets - (progress * initialBottomInsets).roundToInt())
                                    } else {
                                        // enable this in Unistyles 3.0 to get real time bottom insets
                                        // initialBottomInsets - (initialBottomInsets - (progress * initialBottomInsets).roundToInt())
                                        initialBottomInsets
                                    }

                                    this@UnistylesModule.platform.setInsetsCompat(insets, activity.window, nextBottomInset)

                                    if (!isGoingUp) {
                                        this@UnistylesModule.onLayoutConfigChange()
                                    }
                                }

                                return insets
                            }
                        }
                    )
                }
            }
        }
    }

    override fun onHostPause() {
        this.reactApplicationContext.currentActivity?.let { activity ->
            activity.window?.decorView?.let { view ->
                ViewCompat.setOnApplyWindowInsetsListener(view, null)
                ViewCompat.setWindowInsetsAnimationCallback(view, null)
            }
        }
    }

    override fun onHostDestroy() {}
}
