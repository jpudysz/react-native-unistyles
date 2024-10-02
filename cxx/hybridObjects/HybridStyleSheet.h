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
#include "ShadowTreeManager.h"
#include "UnistylesCommitHook.h"

using namespace margelo::nitro::unistyles;
using namespace facebook::react;

struct HybridStyleSheet: public HybridUnistylesStyleSheetSpec {
    HybridStyleSheet(std::shared_ptr<HybridUnistylesRuntime> unistylesRuntime)
      : HybridObject(TAG), _unistylesRuntime{unistylesRuntime} {
          this->_unistylesRuntime->registerPlatformListener(
              std::bind(&HybridStyleSheet::onPlatformDependenciesChange, this, std::placeholders::_1)
          );
      }

    jsi::Value create(jsi::Runtime& rt,
                      const jsi::Value& thisValue,
                      const jsi::Value* args,
                      size_t count);
    jsi::Value configure(jsi::Runtime& rt,
                      const jsi::Value& thisValue,
                      const jsi::Value* args,
                      size_t count);

    void loadHybridMethods() override {
        HybridUnistylesStyleSheetSpec::loadHybridMethods();

        registerHybrids(this, [](Prototype& prototype) {
            prototype.registerRawHybridMethod("create", 1, &HybridStyleSheet::create);
            prototype.registerRawHybridMethod("configure", 1, &HybridStyleSheet::configure);
        });
    };

    double getHairlineWidth() override;
    double get___unid() override;
    
private:
    void parseSettings(jsi::Runtime& rt, jsi::Object settings);
    void parseBreakpoints(jsi::Runtime& rt, jsi::Object breakpoints);
    void parseThemes(jsi::Runtime& rt, jsi::Object themes);
    void verifyAndSelectTheme(jsi::Runtime &rt);
    void setThemeFromColorScheme(jsi::Runtime& rt);
    void loadExternalMethods(const jsi::Value& thisValue, jsi::Runtime& rt);
    void onPlatformDependenciesChange(std::vector<UnistyleDependency> dependencies);
    void registerCommitHook(jsi::Runtime& rt);

    double __unid = -1;
    std::shared_ptr<HybridUnistylesRuntime> _unistylesRuntime;
    std::shared_ptr<core::UnistylesCommitHook> _unistylesCommitHook;
};

