#pragma once

#include <cmath>
#include <jsi/jsi.h>
#include "HybridUnistylesRuntime.h"
#include "HybridUnistylesStyleSheetSpec.hpp"
#include "Helpers.h"
#include "Breakpoints.h"

using namespace margelo::nitro::unistyles;

struct HybridStyleSheet: public HybridUnistylesStyleSheetSpec {
    HybridStyleSheet(std::shared_ptr<HybridUnistylesRuntime> unistylesRuntime)
      : HybridObject(TAG), _unistylesRuntime{unistylesRuntime} {}

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

private:
    void parseSettings(jsi::Runtime& rt, jsi::Object settings);
    void parseBreakpoints(jsi::Runtime& rt, jsi::Object breakpoints);
    void parseThemes(jsi::Runtime& rt, jsi::Object themes);
    void verifyAndSelectTheme(jsi::Runtime &rt);
    void setThemeFromColorScheme(jsi::Runtime& rt);

    std::shared_ptr<HybridUnistylesRuntime> _unistylesRuntime;
    
    // required for parser to work, should be updated on every screen change
    int _lastScreenWidth = _unistylesRuntime->getScreen().width;
};

