#include "HybridShadowRegistry.h"

using namespace margelo::nitro::unistyles;
using namespace facebook::react;

jsi::Value HybridShadowRegistry::link(jsi::Runtime &rt, const jsi::Value &thisValue, const jsi::Value *args, size_t count) {
    helpers::assertThat(rt, count == 2, "Unistyles: Invalid babel transform 'ShadowRegistry link' expected 2 arguments.");

    ShadowNode::Shared shadowNodeWrapper = shadowNodeFromValue(rt, args[0]);
    std::vector<core::Unistyle::Shared> unistyleWrappers = core::unistyleFromValue(rt, args[1]);
    std::vector<std::vector<folly::dynamic>> arguments;
    auto& registry = core::UnistylesRegistry::get();

    for (size_t i = 0; i < unistyleWrappers.size(); i++) {
        if (unistyleWrappers[i]->type == core::UnistyleType::DynamicFunction) {
            auto rawStyle = args[1].asObject(rt).asArray(rt).getValueAtIndex(rt, i);

            helpers::assertThat(rt, rawStyle.isObject(), "Unistyles: Dynamic function is not bound!");

            auto maybeSecrets = rawStyle.getObject(rt).getProperty(rt, helpers::SECRETS.c_str());

            helpers::assertThat(rt, maybeSecrets.isObject(), "Unistyles: Dynamic function is not bound!");

            auto secrets = maybeSecrets.asObject(rt).getProperty(rt, helpers::ARGUMENTS.c_str());

            arguments.push_back(helpers::parseDynamicFunctionArguments(rt, secrets.asObject(rt).asArray(rt)));

            continue;
        }

        arguments.push_back({});
    }

    registry.linkShadowNodeWithUnistyle(rt, &shadowNodeWrapper->getFamily(), unistyleWrappers, this->_scopedVariants, arguments);

    return jsi::Value::undefined();
}

jsi::Value HybridShadowRegistry::unlink(jsi::Runtime &rt, const jsi::Value &thisValue, const jsi::Value *args, size_t count) {
    helpers::assertThat(rt, count == 1, "Unistyles: Invalid babel transform 'ShadowRegistry unlink' expected 1 arguments.");

    ShadowNode::Shared shadowNodeWrapper = shadowNodeFromValue(rt, args[0]);

    auto& registry = core::UnistylesRegistry::get();

    registry.unlinkShadowNodeWithUnistyles(rt, &shadowNodeWrapper->getFamily());

    return jsi::Value::undefined();
}

jsi::Value HybridShadowRegistry::selectVariants(jsi::Runtime &rt, const jsi::Value &thisValue, const jsi::Value *args, size_t count) {
    helpers::assertThat(rt, count == 1, "Unistyles: Invalid babel transform 'ShadowRegistry selectVariants' expected 1 arguments.");

    if (args[0].isUndefined()) {
        this->_scopedVariants = {};
    }

    if (args[0].isObject()) {
        this->_scopedVariants = helpers::variantsToPairs(rt, args[0].asObject(rt));
    }

    return jsi::Value::undefined();
}
