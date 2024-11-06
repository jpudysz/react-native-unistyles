package com.unistyles

import com.facebook.fbreact.specs.NativeTurboUnistylesSpec
import com.facebook.jni.HybridData
import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.RuntimeExecutor
import com.facebook.react.fabric.FabricUIManager
import com.facebook.react.turbomodule.core.interfaces.BindingsInstallerHolder
import com.facebook.react.turbomodule.core.interfaces.TurboModuleWithJSIBindings
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.common.UIManagerType
import com.margelo.nitro.unistyles.HybridNativePlatformSpec

@Suppress("KotlinJniMissingFunction")
class UnistylesModule(reactContext: ReactApplicationContext): NativeTurboUnistylesSpec(reactContext), TurboModuleWithJSIBindings {
    @DoNotStrip
    private var mHybridData: HybridData?
    private val _nativePlatform = NativePlatform()

    companion object {
        const val NAME = NativeTurboUnistylesSpec.NAME
    }

    init {
        mHybridData = initializeHybridData(reactContext)
    }

    private fun initializeHybridData(reactContext: ReactApplicationContext): HybridData {
        val runtimeExecutor = reactContext.catalystInstance?.runtimeExecutor
            ?: throw IllegalStateException("Unistyles: React Native runtime executor is not available. Please follow installation guides.")
        val fabricUIManager = UIManagerHelper.getUIManager(reactContext, UIManagerType.FABRIC) as? FabricUIManager
            ?: throw IllegalStateException("Unistyles: Fabric UI Manager is not available. Please follow installation guides.")

        return initHybrid(runtimeExecutor, fabricUIManager, _nativePlatform)
    }

    @DoNotStrip
    external override fun getBindingsInstaller(): BindingsInstallerHolder

    @DoNotStrip
    private external fun initHybrid(
        runtimeExecutor: RuntimeExecutor,
        fabricUIManager: FabricUIManager,
        nativePlatform: HybridNativePlatformSpec
    ): HybridData
}
