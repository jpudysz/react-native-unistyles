#include "HybridShadowRegistry.h"

using namespace margelo::nitro::unistyles;
using namespace facebook::react;

jsi::Value HybridShadowRegistry::link(jsi::Runtime &rt, const jsi::Value &thisValue, const jsi::Value *args, size_t count) {
    helpers::assertThat(rt, count == 5, "Unistyles: Invalid babel transform 'ShadowRegistry link' expected 5 arguments.");

    ShadowNode::Shared shadowNodeWrapper = shadowNodeFromValue(rt, args[0]);
    std::vector<core::Unistyle::Shared> unistyleWrappers = core::unistyleFromValue(rt, args[1]);
    core::Variants variants = helpers::variantsToPairs(rt, args[2].asObject(rt));
    jsi::Array rawArguments = args[3].asObject(rt).asArray(rt);
    std::optional<std::string> uniquePressableId = args[4].isUndefined()
            ? std::nullopt
            : std::make_optional<std::string>(args[4].asString(rt).utf8(rt));
    std::vector<std::vector<folly::dynamic>> arguments;
    auto& registry = core::UnistylesRegistry::get();
    
    helpers::iterateJSIArray(rt, rawArguments, [&rt, &arguments](size_t index, jsi::Value& value){
        arguments.push_back(helpers::parseDynamicFunctionArguments(rt, value.asObject(rt).asArray(rt)));
    });
    
    auto parser = parser::Parser(this->_unistylesRuntime);
    
    registry.linkShadowNodeWithUnistyle(
        rt,
        &shadowNodeWrapper->getFamily(),
        unistyleWrappers,
        variants,
        arguments,
        this->_scopedTheme,
        uniquePressableId,
        [this, &parser, &rt](std::shared_ptr<core::UnistyleData> unistyleData){
            // if unistyle is in scoped theme, force update with new theme
            if (this->_scopedTheme != std::nullopt) {
                parser.rebuildUnistyleWithScopedTheme(rt, unistyleData->unistyle->parent, unistyleData);
            }
            
            // add or update node for shadow leaf updates, dynamic functions are parsed later
            if (unistyleData->unistyle->type == core::UnistyleType::DynamicFunction) {
                return folly::dynamic(nullptr);
            }
            
            return parser.parseStylesToShadowTreeStyles(rt, {unistyleData});
        }
    );

    return jsi::Value::undefined();
}

jsi::Value HybridShadowRegistry::unlink(jsi::Runtime &rt, const jsi::Value &thisValue, const jsi::Value *args, size_t count) {
    helpers::assertThat(rt, count == 1, "Unistyles: Invalid babel transform 'ShadowRegistry unlink' expected 1 argument.");

    ShadowNode::Shared shadowNodeWrapper = shadowNodeFromValue(rt, args[0]);

    auto& registry = core::UnistylesRegistry::get();

    registry.unlinkShadowNodeWithUnistyles(rt, &shadowNodeWrapper->getFamily());

    return jsi::Value::undefined();
}

jsi::Value HybridShadowRegistry::setScopedTheme(jsi::Runtime &rt, const jsi::Value &thisValue, const jsi::Value *args, size_t count) {
    helpers::assertThat(rt, count == 1, "Unistyles: setScopedTheme expected 1 argument.");
    
    if (args[0].isUndefined()) {
        this->_scopedTheme = std::nullopt;
    }
    
    if (args[0].isString()) {
        this->_scopedTheme = args[0].asString(rt).utf8(rt);
    }
    
    return jsi::Value::undefined();
}
