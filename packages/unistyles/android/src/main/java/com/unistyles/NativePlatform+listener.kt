package com.unistyles

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.SharedPreferences
import android.os.Handler
import android.os.Looper
import androidx.annotation.Keep
import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.react.bridge.ReactApplicationContext
import com.margelo.nitro.unistyles.UnistyleDependency
import com.margelo.nitro.unistyles.UnistylesNativeMiniRuntime

typealias CxxDependencyListener = (dependencies: Array<UnistyleDependency>, miniRuntime: UnistylesNativeMiniRuntime) -> Unit

@Keep
@DoNotStrip
class NativePlatformListener(
    private val reactContext: ReactApplicationContext,
    private val getMiniRuntime: () -> UnistylesNativeMiniRuntime,
    private val diffMiniRuntime: () -> Array<UnistyleDependency>
) {
    private val _dependencyListeners: MutableList<CxxDependencyListener> = mutableListOf()

    private fun notifyConfigChangedWithDelay() {
        Handler(Looper.getMainLooper()).postDelayed({
            this@NativePlatformListener.onConfigChange()
        }, 25)
    }

    private val configurationChangeReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            notifyConfigChangedWithDelay()
        }
    }

    private val rtlPreferenceListener = SharedPreferences.OnSharedPreferenceChangeListener { prefs, key ->
        if (key == "RCTI18nUtil_forceRTL") {
            notifyConfigChangedWithDelay()
        }
    }

    private val i18nUtilSharedPrefs = reactContext.getSharedPreferences(
        "com.facebook.react.modules.i18nmanager.I18nUtil",
        Context.MODE_PRIVATE
    )

    init {
        reactContext.registerReceiver(configurationChangeReceiver, IntentFilter(Intent.ACTION_CONFIGURATION_CHANGED))
        i18nUtilSharedPrefs.registerOnSharedPreferenceChangeListener(rtlPreferenceListener)
    }

    fun onDestroy() {
        this.removePlatformListeners()
        reactContext.unregisterReceiver(configurationChangeReceiver)
        i18nUtilSharedPrefs.unregisterOnSharedPreferenceChangeListener(rtlPreferenceListener)
    }

    fun addPlatformListener(listener: CxxDependencyListener) {
        this._dependencyListeners.add(listener)
    }

    fun removePlatformListeners() {
        this._dependencyListeners.clear()
    }

    private fun emitCxxEvent(dependencies: Array<UnistyleDependency>, miniRuntime: UnistylesNativeMiniRuntime) {
        this._dependencyListeners.forEach { listener ->
            listener(dependencies, miniRuntime)
        }
    }

    fun onConfigChange() {
        val changedDependencies = diffMiniRuntime()

        if (changedDependencies.isNotEmpty()) {
            emitCxxEvent(changedDependencies, getMiniRuntime())
        }
    }
}
