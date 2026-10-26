package com.unistyles

import android.view.Window
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.interfaces.ExtraWindowEventListener

// React Native 0.86+ reports windows created on top of the Activity (e.g. Modal's Dialog)
class NativePlatformExtraWindows(
    private val reactContext: ReactApplicationContext,
    private val onWindowCreate: (window: Window) -> Unit,
    private val onWindowDestroy: (window: Window) -> Unit
) : ExtraWindowEventListener {
    fun startObserving() {
        reactContext.addExtraWindowEventListener(this)
    }

    fun stopObserving() {
        reactContext.removeExtraWindowEventListener(this)
    }

    override fun onExtraWindowCreate(window: Window) {
        onWindowCreate(window)
    }

    override fun onExtraWindowDestroy(window: Window) {
        onWindowDestroy(window)
    }
}
