#pragma once

#include "HybridUnistylesShadowRegistrySpec.hpp"
#include <react/renderer/uimanager/primitives.h>
#include "UnistyleWrapper.h"
#include "UnistylesState.h"
#include "UnistylesRegistry.h"

namespace margelo::nitro::unistyles {

struct HybridShadowRegistry: public HybridUnistylesShadowRegistrySpec {
    HybridShadowRegistry(std::shared_ptr<HybridUnistylesRuntime> unistylesRuntime)
        : HybridObject(TAG), _unistylesRuntime{unistylesRuntime} {}

    jsi::Value link(jsi::Runtime& rt,
                            const jsi::Value& thisValue,
                            const jsi::Value* args,
                            size_t count);
    jsi::Value unlink(jsi::Runtime& rt,
                            const jsi::Value& thisValue,
                            const jsi::Value* args,
                            size_t count);
    jsi::Value selectVariants(jsi::Runtime& rt,
                            const jsi::Value& thisValue,
                            const jsi::Value* args,
                            size_t count);
    jsi::Value setScopedTheme(jsi::Runtime& rt,
                            const jsi::Value& thisValue,
                            const jsi::Value* args,
                            size_t count);
    jsi::Value getScopedTheme(jsi::Runtime& rt,
                            const jsi::Value& thisValue,
                            const jsi::Value* args,
                            size_t count);

    void loadHybridMethods() override {
        HybridUnistylesShadowRegistrySpec::loadHybridMethods();

        registerHybrids(this, [](Prototype& prototype) {
            prototype.registerRawHybridMethod("link", 2, &HybridShadowRegistry::link);
            prototype.registerRawHybridMethod("unlink", 2, &HybridShadowRegistry::unlink);
            prototype.registerRawHybridMethod("selectVariants", 2, &HybridShadowRegistry::selectVariants);
            prototype.registerRawHybridMethod("setScopedTheme", 2, &HybridShadowRegistry::setScopedTheme);
            prototype.registerRawHybridMethod("getScopedTheme", 2, &HybridShadowRegistry::getScopedTheme);
        });
    };

private:
    core::Variants _scopedVariants{};
    std::optional<std::string> _scopedTheme{};
    std::shared_ptr<HybridUnistylesRuntime> _unistylesRuntime;
};

}
