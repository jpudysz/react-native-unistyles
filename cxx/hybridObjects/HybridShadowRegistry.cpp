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

    // check if scope theme exists
    if (this->_scopedTheme.has_value()) {
        auto themeName = this->_scopedTheme.value();

        helpers::assertThat(rt, registry.getState(rt).hasTheme(themeName), "Unistyles: You're trying to use scoped theme '" + themeName + "' but it wasn't registered.");
    }

    auto parser = parser::Parser(this->_unistylesRuntime);
    auto parsedStyleSheet = jsi::Value::undefined();
    std::vector<std::shared_ptr<core::UnistyleData>> unistylesData{};

    // create unistyleData based on wrappers
    for (size_t i = 0; i < unistyleWrappers.size(); i++) {
        core::Unistyle::Shared& unistyle = unistyleWrappers[i];
        std::shared_ptr<core::UnistyleData> unistyleData = std::make_shared<core::UnistyleData>(
            unistyle,
            this->_scopedVariants,
            arguments[i],
            this->_scopedTheme
        );

        // before linking we need to check if given unistyle is affected by scoped theme
        if (this->_scopedTheme.has_value()) {
            if (parsedStyleSheet.isUndefined()) {
                parsedStyleSheet = parser.getParsedStyleSheetForScopedTheme(rt, unistyle, this->_scopedTheme.value());
            }

            // if so we need to force update
            parser.rebuildUnistyleWithScopedTheme(rt, parsedStyleSheet, unistyleData);
        } else {
            // for other styles, not scoped to theme we need to compute variants value
            parser.rebuildUnistyleWithVariants(rt, unistyleData);
        }

        unistylesData.emplace_back(unistyleData);
    }

    registry.linkShadowNodeWithUnistyle(
        rt,
        &shadowNodeWrapper->getFamily(),
        unistylesData
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

jsi::Value HybridShadowRegistry::getScopedTheme(jsi::Runtime &rt, const jsi::Value &thisValue, const jsi::Value *args, size_t count) {
    return this->_scopedTheme.has_value()
        ? jsi::String::createFromUtf8(rt, this->_scopedTheme.value())
        : jsi::Value::undefined();
}
