#pragma once

#include <cmath>
#include <jsi/jsi.h>
#include "HybridUnistylesRuntime.h"
#include "HybridUnistylesStyleSheetSpec.hpp"
#include "HostStyle.h"
#include "Helpers.h"
#include "Constants.h"
#include "Breakpoints.h"
#include "Parser.h"
#include "UnistylesCommitHook.h"
#include "UnistylesMountHook.h"

using namespace margelo::nitro::unistyles;
using namespace facebook::react;

struct HybridStyleSheet: public HybridUnistylesStyleSheetSpec {
    HybridStyleSheet(std::shared_ptr<HybridUnistylesRuntime> unistylesRuntime, std::shared_ptr<UIManager> uiManager)
        : HybridObject(TAG), _unistylesRuntime{unistylesRuntime}, _uiManager{uiManager} {
            this->_unistylesRuntime->registerPlatformListener(
                  std::bind(&HybridStyleSheet::onPlatformDependenciesChange, this, std::placeholders::_1)
            );
            this->_unistylesRuntime->registerImeListener(
                  std::bind(&HybridStyleSheet::onImeChange, this)
            );
      }

    ~HybridStyleSheet() {
        this->_unistylesRuntime->unregisterPlatformListeners();
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
    void registerHooks(jsi::Runtime& rt);
    void onPlatformDependenciesChange(std::vector<UnistyleDependency> dependencies);
    void onImeChange();
    void notifyJSListeners(std::vector<UnistyleDependency>& dependencies);

    double __unid = -1;
    std::vector<std::unique_ptr<const std::function<void(std::vector<UnistyleDependency>&)>>> _changeListeners{};
    std::shared_ptr<HybridUnistylesRuntime> _unistylesRuntime;
    std::shared_ptr<core::UnistylesCommitHook> _unistylesCommitHook;
    std::shared_ptr<core::UnistylesMountHook> _unistylesMountHook;
    std::shared_ptr<UIManager> _uiManager;
};

