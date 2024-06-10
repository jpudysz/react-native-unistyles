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

    fun getScreenDimensions(): Dimensions {
        return this.config.getScreenDimensions()
    }

    fun getColorScheme(): String {
        return this.config.getColorScheme()
    }

    fun getStatusBarDimensions(): Dimensions {
        return this.config.getStatusBarDimensions()
    }

    fun getNavigationBarDimensions(): Dimensions {
        return this.config.getNavigationBarDimensions()
    }

    fun getContentSizeCategory(): String {
        return this.config.getContentSizeCategory()
    }

    fun getInsets(): Insets {
        return this.config.getInsets()
    }
}
