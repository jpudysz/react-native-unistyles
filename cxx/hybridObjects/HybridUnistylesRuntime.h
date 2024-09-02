#pragma once

#include "HybridUnistylesRuntimeSpec.hpp"
#include "HybridNativePlatformSpec.hpp"
#include "Unistyles-Swift-Cxx-Umbrella.hpp"
#include "Helpers.h"
#include "UnistylesRegistry.h"

using namespace margelo::nitro::unistyles;

struct HybridUnistylesRuntime: public HybridUnistylesRuntimeSpec {
    HybridUnistylesRuntime(Unistyles::HybridNativePlatformSpecCxx nativePlatform): HybridObject(TAG), nativePlatform{nativePlatform} {}

    jsi::Value onLoad(jsi::Runtime& rt,
                      const jsi::Value& thisValue,
                      const jsi::Value* args,
                      size_t count);
    jsi::Value updateTheme(jsi::Runtime& rt,
                      const jsi::Value& thisValue,
                      const jsi::Value* args,
                      size_t count);
    
    void loadHybridMethods() override {
        HybridUnistylesRuntimeSpec::loadHybridMethods();

        registerHybrids(this, [](Prototype& prototype) {
            prototype.registerRawHybridMethod("init", 1, &HybridUnistylesRuntime::onLoad);
            prototype.registerRawHybridMethod("updateTheme", 1, &HybridUnistylesRuntime::updateTheme);
        });
    };
    
    ColorScheme getColorScheme() override;
    bool getHasAdaptiveThemes() override;
    bool getRtl() override;
    Dimensions getScreen() override;
    std::optional<std::string> getThemeName() override;
    std::string getContentSizeCategory() override;
    std::optional<std::string> getBreakpoint() override;
    Insets getInsets() override;
    Orientation getOrientation() override;
    double getPixelRatio() override;
    double getFontScale() override;

    void setTheme(const std::string &themeName) override;
    void setAdaptiveThemes(bool isEnabled) override;
    void setImmersiveMode(bool isEnabled) override;
    void setRootViewBackgroundColor(const std::string &hex, std::optional<double> alpha) override;

    // internal
    Dimensions getStatusBarDimensions();
    Dimensions getNavigationBarDimensions();
    
    jsi::Runtime* rt;
private:
    Unistyles::HybridNativePlatformSpecCxx nativePlatform;
};
