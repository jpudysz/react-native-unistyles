package com.unistyles

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Handler
import android.os.Looper
import com.facebook.react.bridge.ReactApplicationContext
import com.margelo.nitro.unistyles.UnistyleDependency

typealias CxxDependencyListener = (dependencies: Array<UnistyleDependency>) -> Unit

class NativePlatformListener(private val reactContext: ReactApplicationContext, private val diffMiniRuntime: () -> Array<UnistyleDependency>) {
    private val _dependencyListeners: MutableList<CxxDependencyListener> = mutableListOf()

    private val configurationChangeReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            Handler(Looper.getMainLooper()).postDelayed({
                this@NativePlatformListener.onConfigChange()
            }, 10)
        }
    }

    init {
        reactContext.registerReceiver(configurationChangeReceiver, IntentFilter(Intent.ACTION_CONFIGURATION_CHANGED))
    }

    fun invalidate() {
        reactContext.unregisterReceiver(configurationChangeReceiver)
    }

    fun addPlatformListener(listener: CxxDependencyListener) {
        this._dependencyListeners.add(listener)
    }

    fun removePlatformListeners() {
        this._dependencyListeners.clear()
    }

    private fun emitCxxEvent(dependencies: Array<UnistyleDependency>) {
        this._dependencyListeners.forEach { listener ->
            listener(dependencies)
        }
    }

    fun onConfigChange() {
        val changedDependencies = diffMiniRuntime()

        if (changedDependencies.isNotEmpty()) {
            emitCxxEvent(changedDependencies)
        }
    }
}
