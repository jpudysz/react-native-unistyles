#include "HybridShadowRegistry.h"

using namespace margelo::nitro::unistyles;
using namespace facebook::react;

jsi::Value HybridShadowRegistry::link(jsi::Runtime &rt, const jsi::Value &thisValue, const jsi::Value *args, size_t count) {
    helpers::assertThat(rt, count == 2, "Unistyles: Invalid babel transform 'ShadowRegistry link' expected 2 arguments.");

    auto shadowNodeWrapper = getShadowNodeFromRef(rt, args[0]);

    std::vector<core::Unistyle::Shared> unistyleWrappers = core::unistyleFromValue(rt, args[1]);
    std::vector<std::vector<folly::dynamic>> arguments;
    auto& registry = core::UnistylesRegistry::get();

    // this is special case for Animated, and prevents appending same unistyles to node
    registry.removeDuplicatedUnistyles(rt, &shadowNodeWrapper->getFamily(), unistyleWrappers);

    if (unistyleWrappers.empty()) {
        return jsi::Value::undefined();
    }

    for (size_t i = 0; i < unistyleWrappers.size(); i++) {
        if (unistyleWrappers[i]->type == core::UnistyleType::DynamicFunction) {
            try {
                auto rawStyle = args[1].asObject(rt).asArray(rt).getValueAtIndex(rt, i);
                auto rawStyleObj = rawStyle.getObject(rt);
                auto unistyleHashKeys = core::getUnistylesHashKeys(rt, rawStyleObj);
                auto secrets = rawStyleObj.getProperty(rt, unistyleHashKeys.at(0).c_str()).asObject(rt);
                auto secretArguments = secrets.getProperty(rt, helpers::ARGUMENTS.c_str()).asObject(rt).asArray(rt);

                arguments.push_back(helpers::parseDynamicFunctionArguments(rt, secretArguments));

                continue;
            } catch (...) {
                arguments.push_back({});
            }
        }

        arguments.push_back({});
    }

    auto scopedTheme = registry.getScopedTheme();
    auto containerBreakpointId = registry.getScopedContainerBreakpointId();

    // check if scope theme exists
    if (scopedTheme.has_value()) {
        auto themeName = scopedTheme.value();

        helpers::assertThat(rt, registry.getState(rt).hasTheme(themeName), "Unistyles: You're trying to use scoped theme '" + themeName + "' but it wasn't registered.");
    }

    auto parser = parser::Parser(this->_unistylesRuntime);
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
            scopedTheme,
            containerBreakpointId
        );

        // set container dimensions context before any parsing
        std::optional<Dimensions> containerDims = std::nullopt;

        if (containerBreakpointId.has_value()) {
            containerDims = registry.getContainerSize(containerBreakpointId.value());
            parser._containerDimensions = containerDims;
        }

        // before linking we need to check if given unistyle is affected by scoped theme
        if (scopedTheme.has_value() && unistyle->styleKey != helpers::EXOTIC_STYLE_KEY) {
            auto parsedStyleSheet = parser.getParsedStyleSheetForScopedTheme(rt, unistyle, scopedTheme.value());

            // if so we need to force update
            parser.rebuildUnistyleWithScopedTheme(rt, parsedStyleSheet, unistyleData);
        } else if (containerDims.has_value() && unistyle->styleKey != helpers::EXOTIC_STYLE_KEY) {
            parser.rebuildUnistyleForContainerSize(rt, unistyleData, containerDims.value());
        }

        parser._containerDimensions = std::nullopt;

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

    auto shadowNodeWrapper = getShadowNodeFromRef(rt, args[0]);

    auto& registry = core::UnistylesRegistry::get();

    registry.unlinkShadowNodeWithUnistyles(rt, &shadowNodeWrapper->getFamily());

    return jsi::Value::undefined();
}

jsi::Value HybridShadowRegistry::flush(jsi::Runtime &rt, const jsi::Value &thisValue, const jsi::Value *args, size_t count) {
    shadow::ShadowTreeManager::updateShadowTree(rt);

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

jsi::Value HybridShadowRegistry::setContainerBreakpointId(jsi::Runtime &rt, const jsi::Value &thisValue, const jsi::Value *args, size_t count) {
    helpers::assertThat(rt, count == 1, "Unistyles: setContainerBreakpointId expected 1 argument.");

    auto& registry = core::UnistylesRegistry::get();

    if (args[0].isUndefined() || args[0].isNull()) {
        registry.setScopedContainerBreakpointId(std::nullopt);
    }

    if (args[0].isNumber()) {
        registry.setScopedContainerBreakpointId(static_cast<int>(args[0].asNumber()));
    }

    return jsi::Value::undefined();
}

jsi::Value HybridShadowRegistry::getContainerBreakpointId(jsi::Runtime &rt, const jsi::Value &thisValue, const jsi::Value *args, size_t count) {
    auto& registry = core::UnistylesRegistry::get();
    auto maybeContainerId = registry.getScopedContainerBreakpointId();

    return maybeContainerId.has_value()
        ? jsi::Value(static_cast<double>(maybeContainerId.value()))
        : jsi::Value::undefined();
}

jsi::Value HybridShadowRegistry::updateContainerSize(jsi::Runtime &rt, const jsi::Value &thisValue, const jsi::Value *args, size_t count) {
    helpers::assertThat(rt, count == 3, "Unistyles: updateContainerSize expected 3 arguments.");

    auto containerId = static_cast<int>(args[0].asNumber());
    auto width = args[1].asNumber();
    auto height = args[2].asNumber();

    auto& registry = core::UnistylesRegistry::get();
    auto oldSize = registry.getContainerSize(containerId);

    if (oldSize.has_value() &&
        oldSize->width == width &&
        oldSize->height == height) {
        return jsi::Value::undefined();
    }

    registry.setContainerSize(containerId, Dimensions(width, height));

    auto dependencyMap = registry.buildContainerDependencyMap(rt, containerId);

    if (dependencyMap.empty()) {
        return jsi::Value::undefined();
    }

    auto parser = parser::Parser(this->_unistylesRuntime);
    std::vector<std::shared_ptr<core::StyleSheet>> emptyStyleSheets;

    parser.rebuildUnistylesInDependencyMap(rt, dependencyMap, emptyStyleSheets, std::nullopt);
    parser.rebuildShadowLeafUpdates(rt, dependencyMap);
    shadow::ShadowTreeManager::updateShadowTree(rt);

    return jsi::Value::undefined();
}

std::shared_ptr<const core::ShadowNode> HybridShadowRegistry::getShadowNodeFromRef(jsi::Runtime& rt, const jsi::Value& maybeRef) {
#if REACT_NATIVE_VERSION_MINOR >= 81
    return Bridging<std::shared_ptr<const ShadowNode>>::fromJs(rt, maybeRef);
#else
    return shadowNodeFromValue(rt, maybeRef);
#endif
}
