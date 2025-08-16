#pragma once

#include "HybridUnistylesShadowRegistrySpec.hpp"
#include <react/renderer/uimanager/primitives.h>
#include "UnistyleWrapper.h"
#include "UnistylesState.h"
#include "UnistylesRegistry.h"
#include "ShadowTreeManager.h"
#include <cxxreact/ReactNativeVersion.h>

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
    jsi::Value flush(jsi::Runtime& rt,
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
            prototype.registerRawHybridMethod("unlink", 1, &HybridShadowRegistry::unlink);
            prototype.registerRawHybridMethod("flush", 0, &HybridShadowRegistry::flush);
            prototype.registerRawHybridMethod("setScopedTheme", 1, &HybridShadowRegistry::setScopedTheme);
            prototype.registerRawHybridMethod("getScopedTheme", 0, &HybridShadowRegistry::getScopedTheme);
        });
    };
    
    std::shared_ptr<const core::ShadowNode> getShadowNodeFromRef(jsi::Runtime& rt, const jsi::Value& maybeRef);

private:
    std::shared_ptr<HybridUnistylesRuntime> _unistylesRuntime;
};

}
