#pragma once

#include <cmath>
#include <jsi/jsi.h>
#include <mutex>
#include <unordered_map>
#include "HybridUnistylesRuntime.h"
#include "HybridUnistylesStyleSheetSpec.hpp"
#include "RNStyle.h"
#include "Helpers.h"
#include "UnistylesConstants.h"
#include "Breakpoints.h"
#include "Parser.h"
#include "ShadowTreeManager.h"

using namespace margelo::nitro::unistyles;
using namespace facebook::react;

struct HybridStyleSheet: public HybridUnistylesStyleSheetSpec {
    HybridStyleSheet(std::shared_ptr<HybridUnistylesRuntime> unistylesRuntime): HybridObject(TAG), _unistylesRuntime{unistylesRuntime} {
            this->_unistylesRuntime->registerPlatformListener(
                  std::bind(&HybridStyleSheet::onPlatformDependenciesChange, this, std::placeholders::_1)
            );
            this->_unistylesRuntime->registerNativePlatformListener(
                  std::bind(&HybridStyleSheet::onPlatformNativeDependenciesChange, this, std::placeholders::_1, std::placeholders::_2)
            );
            this->_unistylesRuntime->registerImeListener(
                  std::bind(&HybridStyleSheet::onImeChange, this, std::placeholders::_1)
            );
      }

    ~HybridStyleSheet() {
        this->_unistylesRuntime->unregisterNativePlatformListeners();
    }

    jsi::Value create(jsi::Runtime& rt,
                      const jsi::Value& thisValue,
                      const jsi::Value* args,
                      size_t count);
    jsi::Value configure(jsi::Runtime& rt,
                      const jsi::Value& thisValue,
                      const jsi::Value* args,
                      size_t count);
    jsi::Value init(jsi::Runtime& rt,
                      const jsi::Value& thisValue,
                      const jsi::Value* args,
                      size_t count);

    void loadHybridMethods() override {
        HybridUnistylesStyleSheetSpec::loadHybridMethods();

        registerHybrids(this, [](Prototype& prototype) {
            prototype.registerRawHybridMethod("init", 1, &HybridStyleSheet::init);
            prototype.registerRawHybridMethod("create", 1, &HybridStyleSheet::create);
            prototype.registerRawHybridMethod("configure", 1, &HybridStyleSheet::configure);
        });
    };

    double getHairlineWidth() override;
    double getUnid() override;
    std::function<void ()> addChangeListener(const std::function<void (const std::vector<UnistyleDependency> &)>& onChanged) override;

private:
    void parseSettings(jsi::Runtime& rt, jsi::Object settings);
    void parseBreakpoints(jsi::Runtime& rt, jsi::Object breakpoints);
    void parseThemes(jsi::Runtime& rt, jsi::Object themes);
    void verifyAndSelectTheme(jsi::Runtime &rt);
    void setThemeFromColorScheme(jsi::Runtime& rt);
    void loadExternalMethods(const jsi::Value& thisValue, jsi::Runtime& rt);
    void onPlatformDependenciesChange(std::vector<UnistyleDependency> dependencies);
    void onPlatformNativeDependenciesChange(std::vector<UnistyleDependency> dependencies, UnistylesNativeMiniRuntime miniRuntime);
    void onImeChange(UnistylesNativeMiniRuntime miniRuntime);
    void notifyJSListeners(std::vector<UnistyleDependency>& dependencies);

    bool isInitialized = false;
    double __unid = -1;
    std::unordered_map<size_t, std::unique_ptr<std::function<void(std::vector<UnistyleDependency>&)>>> _changeListeners{};
    std::mutex _listenersMutex;
    std::shared_ptr<HybridUnistylesRuntime> _unistylesRuntime;
    std::shared_ptr<UIManager> _uiManager;
};

