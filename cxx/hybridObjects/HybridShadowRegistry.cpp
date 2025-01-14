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
            try {
                auto rawStyle = args[1].asObject(rt).asArray(rt).getValueAtIndex(rt, i);
                auto rawStyleObj = rawStyle.getObject(rt);
                auto unistyleHashKeys = core::getUnistylesHashKeys(rt, rawStyleObj);
                auto secrets = rawStyleObj.getProperty(rt, unistyleHashKeys.at(0).c_str()).asObject(rt);
                auto secretArguments = secrets.getProperty(rt, helpers::ARGUMENTS.c_str()).asObject(rt);

                arguments.push_back(helpers::parseDynamicFunctionArguments(rt, secretArguments.asArray(rt)));

                continue;
            } catch (...) {
                arguments.push_back({});
            }
        }

        arguments.push_back({});
    }

    auto scopedTheme = registry.getScopedTheme();

    // check if scope theme exists
    if (scopedTheme.has_value()) {
        auto themeName = scopedTheme.value();

        helpers::assertThat(rt, registry.getState(rt).hasTheme(themeName), "Unistyles: You're trying to use scoped theme '" + themeName + "' but it wasn't registered.");
    }

    auto parser = parser::Parser(this->_unistylesRuntime);
    auto parsedStyleSheet = jsi::Value::undefined();
    std::vector<std::shared_ptr<core::UnistyleData>> unistylesData{};

    // create unistyleData based on wrappers
    for (size_t i = 0; i < unistyleWrappers.size(); i++) {
        core::Unistyle::Shared& unistyle = unistyleWrappers[i];
        auto rawStyle = args[1].asObject(rt).asArray(rt).getValueAtIndex(rt, i);
        auto rawStyleObj = rawStyle.getObject(rt);
        auto unistyleHashKeys = core::getUnistylesHashKeys(rt, rawStyleObj);
        core::Variants variants{};

        if (unistyleHashKeys.size() == 1) {
            auto secrets = rawStyleObj.getProperty(rt, unistyleHashKeys.at(0).c_str()).asObject(rt);
            auto hasVariants = secrets.hasProperty(rt, helpers::STYLESHEET_VARIANTS.c_str());

            if (hasVariants) {
                variants = helpers::variantsToPairs(rt, secrets.getProperty(rt, helpers::STYLESHEET_VARIANTS.c_str()).asObject(rt));
            }
        }

        std::shared_ptr<core::UnistyleData> unistyleData = std::make_shared<core::UnistyleData>(
            unistyle,
            variants,
            arguments[i],
            scopedTheme
        );

        // before linking we need to check if given unistyle is affected by scoped theme
        if (scopedTheme.has_value()) {
            if (parsedStyleSheet.isUndefined()) {
                parsedStyleSheet = parser.getParsedStyleSheetForScopedTheme(rt, unistyle, scopedTheme.value());
            }

            // if so we need to force update
            parser.rebuildUnistyleWithScopedTheme(rt, parsedStyleSheet, unistyleData);
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

jsi::Value HybridShadowRegistry::setScopedTheme(jsi::Runtime &rt, const jsi::Value &thisValue, const jsi::Value *args, size_t count) {
    helpers::assertThat(rt, count == 1, "Unistyles: setScopedTheme expected 1 argument.");

    auto& registry = core::UnistylesRegistry::get();

    if (args[0].isUndefined()) {

        registry.setScopedTheme(std::nullopt);
    }

    if (args[0].isString()) {
        registry.setScopedTheme(args[0].asString(rt).utf8(rt));
    }

    return jsi::Value::undefined();
}

jsi::Value HybridShadowRegistry::getScopedTheme(jsi::Runtime &rt, const jsi::Value &thisValue, const jsi::Value *args, size_t count) {
    auto& registry = core::UnistylesRegistry::get();
    auto maybeScopedTheme = registry.getScopedTheme();

    return maybeScopedTheme.has_value()
        ? jsi::String::createFromUtf8(rt, maybeScopedTheme.value())
        : jsi::Value::undefined();
}
