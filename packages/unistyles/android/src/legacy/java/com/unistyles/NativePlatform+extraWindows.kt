package com.unistyles

import android.view.Window
import com.facebook.react.bridge.ReactApplicationContext

// React Native below 0.86 doesn't report windows created on top of the Activity (e.g. Modal's Dialog)
@Suppress("UNUSED_PARAMETER")
class NativePlatformExtraWindows(
    reactContext: ReactApplicationContext,
    onWindowCreate: (window: Window) -> Unit,
    onWindowDestroy: (window: Window) -> Unit
) {
    fun startObserving() {}

    fun stopObserving() {}
}
