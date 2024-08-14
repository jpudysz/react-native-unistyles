package com.unistyles

import android.util.Log
import android.view.View
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ReactShadowNode
import com.facebook.react.uimanager.ViewManager

class UnistylesPackage: ReactPackage {
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

    override fun createNativeModules(reactContext: ReactApplicationContext): MutableList<NativeModule> {
        return mutableListOf()
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): MutableList<ViewManager<View, ReactShadowNode<*>>> {
        return mutableListOf()
    }
}
