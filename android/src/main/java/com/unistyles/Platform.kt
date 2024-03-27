package com.unistyles

import com.facebook.react.bridge.ReactApplicationContext

class Platform(reactApplicationContext: ReactApplicationContext) {
    private val config: UnistylesConfig = UnistylesConfig(reactApplicationContext)

    var defaultNavigationBarColor: Int? = null
    var defaultStatusBarColor: Int? = null

    fun hasNewLayoutConfig(): Boolean {
        return this.config.hasNewLayoutConfig()
    }

    fun hasNewConfig(): Boolean {
        return this.config.hasNewConfig()
    }

    fun getConfig(): Config {
        return this.config.getConfig()
    }

    fun getLayoutConfig(): LayoutConfig {
        return this.config.getLayoutConfig()
    }
}
