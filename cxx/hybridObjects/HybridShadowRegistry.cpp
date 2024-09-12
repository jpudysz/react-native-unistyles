#include "HybridShadowRegistry.h"

using namespace margelo::nitro::unistyles;

jsi::Value HybridShadowRegistry::link(jsi::Runtime &rt, const jsi::Value &thisValue, const jsi::Value *args, size_t count) {
//    core::Unistyle::Shared unistyleWrapper = core::unistyleFromValue(rt, args[0]);
    ShadowNode::Shared shadowNodeWrapper = shadowNodeFromValue(rt, args[1]);
//    auto& family = shadowNodeWrapper->getFamily();
//    
//    _registry[family] = _registry[family].emplace_back(unistyleWrapper);
//    
    return jsi::Value::undefined();
}

jsi::Value HybridShadowRegistry::unlink(jsi::Runtime &rt, const jsi::Value &thisValue, const jsi::Value *args, size_t count) {
//    core::Unistyle::Shared unistyleWrapper = core::unistyleFromValue(rt, args[0]);
//    ShadowNode::Shared shadowNodeWrapper = shadowNodeFromValue(rt, args[1]);
//    auto& family = shadowNodeWrapper->getFamily();
    
    // todo remove node
    
    return jsi::Value::undefined();
}
