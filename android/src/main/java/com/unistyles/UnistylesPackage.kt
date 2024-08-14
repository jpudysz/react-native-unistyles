package com.unistyles

import android.util.Log
import com.facebook.react.TurboReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfoProvider

class UnistylesPackage: TurboReactPackage() {
    companion object {
        private const val TAG: String = "Unistyles"

        init {
            try {
                System.loadLibrary("unistyles")
                Log.i(TAG, "Installed Unistyles \uD83E\uDD84!")
            } catch (e: Throwable) {
                Log.e(TAG, "Failed to load Unistyles C++ library! Is it properly linked?", e)
                throw e
            }
        }
    }

    override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? = null
    override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
        return ReactModuleInfoProvider { emptyMap() }
    }
}
