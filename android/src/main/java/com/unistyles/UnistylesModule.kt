package com.unistyles

import android.util.Log
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class UnistylesModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName() = NAME
    companion object {
        const val NAME = "Unistyles"
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    fun install(): Boolean {
        Log.i(NAME, "Installed Unistyles \uD83E\uDD84!")

        return true
    }
}
