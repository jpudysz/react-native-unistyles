#pragma once

#include <cmath>
#include "HybridStyleSheetSpec.hpp"
#include "HybridUnistylesRuntime.h"
// todo remove me
#include <NitroModules/HybridContext.hpp>
#include "Unistyles-Swift-Cxx-Umbrella.hpp"
#include "UnistylesHelpers.h"
#include "StyleSheetRegistry.h"

using namespace margelo::nitro::unistyles;

struct HybridStyleSheet: public HybridStyleSheetSpec {
    HybridStyleSheet(Unistyles::HybridNativePlatformSpecCxx nativePlatform, std::shared_ptr<HybridUnistylesRuntime> unistylesRuntime) 
        : nativePlatform{nativePlatform}, unistylesRuntime{unistylesRuntime} {}
    
    jsi::Value create(jsi::Runtime& rt,
                      const jsi::Value& thisValue,
                      const jsi::Value* args,
                      size_t count);
    jsi::Value configure(jsi::Runtime& rt,
                      const jsi::Value& thisValue,
                      const jsi::Value* args,
                      size_t count);
    
    void loadHybridMethods() override {
        HybridStyleSheetSpec::loadHybridMethods();

        registerHybrids(this, [](Prototype& prototype) {
            prototype.registerHybridMethod("create", &HybridStyleSheet::create);
            prototype.registerHybridMethod("configure", &HybridStyleSheet::configure);
        });
    };
    
    double getHairlineWidth() override;
    
private:
    void parseSettings(jsi::Runtime& rt, jsi::Object settings);
    void parseBreakpoints(jsi::Runtime& rt, jsi::Object breakpoints);
    void parseThemes(jsi::Runtime& rt, jsi::Object themes);
    
    Unistyles::HybridNativePlatformSpecCxx nativePlatform;
    std::shared_ptr<HybridUnistylesRuntime> unistylesRuntime;
    core::StyleSheetRegistry styleSheetRegistry{};
};

