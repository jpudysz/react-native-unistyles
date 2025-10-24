#pragma once

#include "HybridUnistylesRuntimeSpec.hpp"
#include "HybridNativePlatformSpec.hpp"
#include "NativePlatform.h"
#include "UnistylesState.h"
#include "HybridUnistylesStatusBarSpec.hpp"
#include "HybridNavigationBar.h"
#include "HybridStatusBar.h"
#include "UnistylesRegistry.h"
#include "Helpers.h"

namespace margelo::nitro::unistyles {

struct HybridUnistylesRuntime: public HybridUnistylesRuntimeSpec {
    HybridUnistylesRuntime(std::shared_ptr<HybridNativePlatformSpec> nativePlatform, jsi::Runtime& rt, std::function<void(std::function<void(jsi::Runtime&)>&&)> runOnJSThread)
        : HybridObject(TAG), _nativePlatform{nativePlatform}, _rt{&rt}, runOnJSThread(std::move(runOnJSThread)) {}

    jsi::Value getTheme(jsi::Runtime& rt,
                            const jsi::Value& thisValue,
                            const jsi::Value* args,
                            size_t count);
    jsi::Value updateTheme(jsi::Runtime& rt,
                            const jsi::Value& thisValue,
                            const jsi::Value* args,
                            size_t count);
    jsi::Value createHybridStatusBar(jsi::Runtime& rt,
                            const jsi::Value& thisValue,
                            const jsi::Value* args,
                            size_t count);
    jsi::Value createHybridNavigationBar(jsi::Runtime& rt,
                            const jsi::Value& thisValue,
                            const jsi::Value* args,
                            size_t count);

    void loadHybridMethods() override {
        HybridUnistylesRuntimeSpec::loadHybridMethods();

        registerHybrids(this, [](Prototype& prototype) {
            prototype.registerRawHybridMethod("getTheme", 1, &HybridUnistylesRuntime::getTheme);
            prototype.registerRawHybridMethod("updateTheme", 1, &HybridUnistylesRuntime::updateTheme);
            prototype.registerRawHybridMethod("createHybridStatusBar", 0, &HybridUnistylesRuntime::createHybridStatusBar);
            prototype.registerRawHybridMethod("createHybridNavigationBar", 0, &HybridUnistylesRuntime::createHybridNavigationBar);
        });
    };

    ColorScheme getColorScheme() override;
    bool getHasAdaptiveThemes() override;
    bool getRtl() override;
    bool getIsLandscape() override;
    bool getIsPortrait() override;
    Dimensions getScreen() override;
    std::optional<std::string> getThemeName() override;
    std::string getContentSizeCategory() override;
    std::optional<std::string> getBreakpoint() override;
    Insets getInsets() override;
    Orientation getOrientation() override;
    double getPixelRatio() override;
    double getFontScale() override;
    void registerPlatformListener(const std::function<void(std::vector<UnistyleDependency>)>& listener);
    void registerNativePlatformListener(const std::function<void(std::vector<UnistyleDependency>, UnistylesNativeMiniRuntime)>& listener);
    void registerImeListener(const std::function<void(UnistylesNativeMiniRuntime)>& listener);
    void unregisterNativePlatformListeners();

    void setTheme(const std::string &themeName) override;
    void setAdaptiveThemes(bool isEnabled) override;
    void setImmersiveModeNative(bool isEnabled) override;
    void nativeSetRootViewBackgroundColor(double color) override;
    UnistylesCxxMiniRuntime getMiniRuntime() override;
    std::unordered_map<std::string, double> getBreakpoints() override;

    jsi::Runtime& getRuntime();
    UnistylesCxxMiniRuntime buildMiniRuntimeFromNativeRuntime(UnistylesNativeMiniRuntime& nativeMiniRuntime);
    jsi::Value getMiniRuntimeAsValue(jsi::Runtime& rt, std::optional<UnistylesNativeMiniRuntime> maybeMiniRuntime);
    void includeDependenciesForColorSchemeChange(std::vector<UnistyleDependency>& deps);
    void calculateNewThemeAndDependencies(std::vector<UnistyleDependency>& deps);
    std::function<void(std::function<void(jsi::Runtime&)>&&)> runOnJSThread;

private:
    jsi::Runtime* _rt;
    std::shared_ptr<HybridNavigationBar> _navigationBar;
    std::shared_ptr<HybridStatusBar> _statusBar;
    std::shared_ptr<HybridNativePlatformSpec> _nativePlatform;
    std::function<void(std::vector<UnistyleDependency>)> _onDependenciesChange;
    std::function<void(std::vector<UnistyleDependency>, UnistylesNativeMiniRuntime)> _onNativeDependenciesChange;
};

}
