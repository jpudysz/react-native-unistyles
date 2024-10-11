#include "HybridShadowRegistry.h"

using namespace margelo::nitro::unistyles;
using namespace facebook::react;

jsi::Value HybridShadowRegistry::link(jsi::Runtime &rt, const jsi::Value &thisValue, const jsi::Value *args, size_t count) {
    helpers::assertThat(rt, count == 4, "Unistyles: Invalid babel transform 'ShadowRegistry link' expected 4 arguments.");

    ShadowNode::Shared shadowNodeWrapper = shadowNodeFromValue(rt, args[0]);
    core::Unistyle::Shared unistyleWrapper = core::unistyleFromValue(rt, args[1]);
    core::Variants variants = helpers::variantsToPairs(rt, args[2].asObject(rt));
    auto rawArguments = args[3].asObject(rt).asArray(rt);
    std::vector<folly::dynamic> arguments = helpers::parseDynamicFunctionArguments(rt, rawArguments);

    auto& registry = core::UnistylesRegistry::get();

    registry.linkShadowNodeWithUnistyle(&shadowNodeWrapper->getFamily(), unistyleWrapper, variants, arguments);

    return jsi::Value::undefined();
}

jsi::Value HybridShadowRegistry::unlink(jsi::Runtime &rt, const jsi::Value &thisValue, const jsi::Value *args, size_t count) {
    helpers::assertThat(rt, count == 2, "Unistyles: Invalid babel transform 'ShadowRegistry unlink' expected 2 arguments.");

    ShadowNode::Shared shadowNodeWrapper = shadowNodeFromValue(rt, args[0]);
    core::Unistyle::Shared unistyleWrapper = core::unistyleFromValue(rt, args[1]);

    auto& registry = core::UnistylesRegistry::get();

    registry.unlinkShadowNodeWithUnistyle(&shadowNodeWrapper->getFamily(), unistyleWrapper);

    return jsi::Value::undefined();
}
