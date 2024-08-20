#pragma once

#include "HybridStyleSheetSpec.hpp"
// todo remove me
#include <NitroModules/HybridContext.hpp>
#include "Unistyles-Swift-Cxx-Umbrella.hpp"
#include "UnistylesHelpers.h"
#include "StyleSheetRegistry.h"

using namespace margelo::nitro::unistyles;

struct HybridStyleSheet: public HybridStyleSheetSpec {
    HybridStyleSheet(Unistyles::HybridNativePlatformSpecCxx _nativePlatform): nativePlatform{_nativePlatform} {}
    
    jsi::Value create(jsi::Runtime& rt,
                      const jsi::Value& thisValue,
                      const jsi::Value* args,
                      size_t count);
    
    void loadHybridMethods() override {
        HybridStyleSheetSpec::loadHybridMethods();

        registerHybrids(this, [](Prototype& prototype) {
            prototype.registerHybridMethod("create", &HybridStyleSheet::create);
        });
    };
    
private:
    Unistyles::HybridNativePlatformSpecCxx nativePlatform;
    core::StyleSheetRegistry styleSheetRegistry{};
};

