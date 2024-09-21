#pragma once

#include "HybridUnistylesShadowRegistrySpec.hpp"

namespace margelo::nitro::unistyles {

struct HybridShadowRegistry: public HybridUnistylesShadowRegistrySpec {
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
        HybridUnistylesShadowRegistrySpec::loadHybridMethods();

        registerHybrids(this, [](Prototype& prototype) {
            prototype.registerRawHybridMethod("link", 2, &HybridShadowRegistry::link);
            prototype.registerRawHybridMethod("unlink", 2, &HybridShadowRegistry::unlink);
        });
    };
};

}
