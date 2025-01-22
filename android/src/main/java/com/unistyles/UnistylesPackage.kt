package com.unistyles

import com.facebook.react.TurboReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

class UnistylesPackage: TurboReactPackage() {
    override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
        return if (name == UnistylesModule.NAME) {
            UnistylesModule(reactContext)
        } else {
            null
        }
    }

    override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
        return ReactModuleInfoProvider {
            mapOf(UnistylesModule.NAME to ReactModuleInfo(
                UnistylesModule.NAME,
                UnistylesModule.NAME,
                canOverrideExistingModule = true,
                needsEagerInit = true,
                isCxxModule = true,
                isTurboModule = true
            ))
        }
    }
}
