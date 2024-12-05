#include "HybridShadowRegistry.h"

using namespace margelo::nitro::unistyles;
using namespace facebook::react;

jsi::Value HybridShadowRegistry::link(jsi::Runtime &rt, const jsi::Value &thisValue, const jsi::Value *args, size_t count) {
    helpers::assertThat(rt, count == 4, "Unistyles: Invalid babel transform 'ShadowRegistry link' expected 4 arguments.");

    ShadowNode::Shared shadowNodeWrapper = shadowNodeFromValue(rt, args[0]);
    std::vector<core::Unistyle::Shared> unistyleWrappers = core::unistyleFromValue(rt, args[1]);
    jsi::Array rawArguments = args[2].asObject(rt).asArray(rt);
    std::optional<std::string> uniquePressableId = args[3].isUndefined()
            ? std::nullopt
            : std::make_optional<std::string>(args[3].asString(rt).utf8(rt));
    std::vector<std::vector<folly::dynamic>> arguments;
    auto& registry = core::UnistylesRegistry::get();
    
    helpers::iterateJSIArray(rt, rawArguments, [&rt, &arguments](size_t index, jsi::Value& value){
        arguments.push_back(helpers::parseDynamicFunctionArguments(rt, value.asObject(rt).asArray(rt)));
    });
    
    registry
        .linkShadowNodeWithUnistyle(rt,
                                    &shadowNodeWrapper->getFamily(),
                                    unistyleWrappers,
                                    this->_scopedVariants,
                                    arguments,
                                    uniquePressableId);

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
