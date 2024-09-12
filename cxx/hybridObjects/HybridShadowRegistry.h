#pragma once

#include "HybridShadowRegistrySpec.hpp"
#include <react/renderer/uimanager/UIManager.h>
#include <react/renderer/uimanager/primitives.h>
#include <jsi/jsi.h>
#include "Unistyle.h"
#include "UnistyleWrapper.h"

using namespace margelo::nitro::unistyles;

using namespace facebook::jsi;
using namespace facebook::react;

struct HybridShadowRegistry: public HybridShadowRegistrySpec {
    HybridShadowRegistry(): HybridObject(TAG) {}
    
    jsi::Value link(jsi::Runtime& rt,
                      const jsi::Value& thisValue,
                      const jsi::Value* args,
                      size_t count);
    jsi::Value unlink(jsi::Runtime& rt,
                      const jsi::Value& thisValue,
                      const jsi::Value* args,
                      size_t count);

    void loadHybridMethods() override {
        HybridShadowRegistrySpec::loadHybridMethods();

        registerHybrids(this, [](Prototype& prototype) {
            prototype.registerRawHybridMethod("link", 2, &HybridShadowRegistry::link);
            prototype.registerRawHybridMethod("unlink", 2, &HybridShadowRegistry::unlink);
        });
    };
    
private:
//    std::unordered_map<const ShadowNodeFamily&, std::vector<const core::Unistyle&>> _registry;
};
