package com.unistyles

import android.util.Log
import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.fbreact.specs.NativeTurboUnistylesSpec
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.turbomodule.core.interfaces.BindingsInstallerHolder
import com.facebook.react.turbomodule.core.interfaces.TurboModuleWithJSIBindings

class UnistylesModule(reactContext: ReactApplicationContext): NativeTurboUnistylesSpec(reactContext), TurboModuleWithJSIBindings {
    companion object {
        const val NAME = NativeTurboUnistylesSpec.NAME

        init {
            try {
                System.loadLibrary("unistyles")

                Log.i(NAME, "Installed Unistyles \uD83E\uDD84!")
            } catch (error: Throwable) {
                Log.e(NAME, "Failed to load Unistyles C++ library! Is it properly linked?", error)

                throw error
            }
        }
    }

    @DoNotStrip
    external override fun getBindingsInstaller(): BindingsInstallerHolder
}
