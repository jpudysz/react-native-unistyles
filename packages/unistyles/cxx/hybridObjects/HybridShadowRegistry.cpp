#include "HybridShadowRegistry.h"

using namespace margelo::nitro::unistyles;
using namespace facebook::react;

jsi::Value HybridShadowRegistry::link(jsi::Runtime &rt, const jsi::Value &thisValue, const jsi::Value *args, size_t count) {
    helpers::assertThat(rt, count == 2, "Unistyles: Invalid babel transform 'ShadowRegistry link' expected 2 arguments.");

    auto shadowNodeWrapper = getShadowNodeFromRef(rt, args[0]);

    std::vector<core::Unistyle::Shared> unistyleWrappers = core::unistyleFromValue(rt, args[1]);
    std::vector<std::vector<folly::dynamic>> arguments;
    auto& registry = core::UnistylesRegistry::get();
    const bool wasSuspended = registry.isSuspended(&shadowNodeWrapper->getFamily());

    // this is special case for Animated, and prevents appending same unistyles to node
    // skip for suspended families - they need a full re-link with fresh UnistyleData
    if (!wasSuspended) {
        registry.removeDuplicatedUnistyles(&shadowNodeWrapper->getFamily(), unistyleWrappers);

        if (unistyleWrappers.empty()) {
            return jsi::Value::undefined();
        }
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

    // check if scope theme exists
    if (scopedTheme.has_value()) {
        auto themeName = scopedTheme.value();

        helpers::assertThat(rt, registry.getState().hasTheme(themeName), "Unistyles: You're trying to use scoped theme '" + themeName + "' but it wasn't registered.");
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
            scopedTheme
        );

        // before linking we need to check if given unistyle is affected by scoped theme
        if (scopedTheme.has_value() && unistyle->styleKey != helpers::EXOTIC_STYLE_KEY) {
            auto parsedStyleSheet = parser.getParsedStyleSheetForScopedTheme(rt, unistyle, scopedTheme.value());

            // if so we need to force update
            parser.rebuildUnistyleWithScopedTheme(rt, parsedStyleSheet, unistyleData);
        }

        // The shared cache can belong to another view by the time React attaches refs.
        // Restore this view's arguments and variants before saving its native styles.
        if (!unistyleData->parsedStyle.has_value() && unistyle->parsedStyle.has_value()) {
            parser.rebuildUnistyleWithVariants(rt, unistyleData);
        }

        unistylesData.emplace_back(unistyleData);
    }

    std::optional<folly::dynamic> initialScopedUpdate;
    bool shouldCommit = wasSuspended;

    if (scopedTheme.has_value() || wasSuspended) {
        initialScopedUpdate = parser.parseStylesToShadowTreeUpdates(rt, unistylesData);
    } else if (shadow::hasNativeProps(&shadowNodeWrapper->getFamily())) {
        auto update = parser.parseStylesToShadowTreeUpdates(rt, unistylesData);

        if (shadow::hasOutdatedNativeProps(&shadowNodeWrapper->getFamily(), update)) {
            initialScopedUpdate = std::move(update);
            shouldCommit = true;
        }
    }

    registry.linkShadowNodeWithUnistyle(
        rt,
        shadowNodeWrapper->getFamilyShared(),
        unistylesData,
        std::move(initialScopedUpdate)
    );

    if (shouldCommit) {
        shadow::ShadowTreeManager::updateShadowTree(rt);
    }

    return jsi::Value::undefined();
}

jsi::Value HybridShadowRegistry::unlink(jsi::Runtime &rt, const jsi::Value &thisValue, const jsi::Value *args, size_t count) {
    helpers::assertThat(rt, count == 1, "Unistyles: Invalid babel transform 'ShadowRegistry unlink' expected 1 argument.");

    auto shadowNodeWrapper = getShadowNodeFromRef(rt, args[0]);

    auto& registry = core::UnistylesRegistry::get();

    registry.unlinkShadowNodeWithUnistyles(&shadowNodeWrapper->getFamily());

    return jsi::Value::undefined();
}

jsi::Value HybridShadowRegistry::suspend(jsi::Runtime &rt, const jsi::Value &thisValue, const jsi::Value *args, size_t count) {
    helpers::assertThat(rt, count == 1, "Unistyles: Invalid babel transform 'ShadowRegistry suspend' expected 1 argument.");

    auto shadowNodeWrapper = getShadowNodeFromRef(rt, args[0]);
    auto& registry = core::UnistylesRegistry::get();

    registry.suspendShadowNode(&shadowNodeWrapper->getFamily());

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

jsi::Value HybridShadowRegistry::verify(jsi::Runtime &rt, const jsi::Value &thisValue, const jsi::Value *args, size_t count) {
    return shadow::ShadowTreeDiagnostics::verify(rt, this->_unistylesRuntime);
}

jsi::Value HybridShadowRegistry::takeCommittedTags(jsi::Runtime &rt, const jsi::Value &thisValue, const jsi::Value *args, size_t count) {
    auto tags = core::UnistylesRegistry::get().takeCommittedTags();
    auto result = jsi::Array(rt, tags.size());

    for (size_t i = 0; i < tags.size(); i++) {
        result.setValueAtIndex(rt, i, jsi::Value(static_cast<double>(tags[i])));
    }

    return result;
}

jsi::Value HybridShadowRegistry::refreshReactNodes(jsi::Runtime &rt, const jsi::Value &thisValue, const jsi::Value *args, size_t count) {
    helpers::assertThat(rt, count == 1 && args[0].isObject(), "Unistyles: refreshReactNodes expected to be called with an array of shadow nodes.");

    auto nodes = args[0].asObject(rt).asArray(rt);
    std::unordered_map<SurfaceId, std::shared_ptr<const RootShadowNode>> roots;

    UIManagerBinding::getBinding(rt)->getUIManager().getShadowTreeRegistry().enumerate([&roots](const ShadowTree& shadowTree, bool&) {
        roots.emplace(shadowTree.getSurfaceId(), shadowTree.getCurrentRevision().rootShadowNode);
    });

    for (size_t i = 0; i < nodes.size(rt); i++) {
        auto node = nodes.getValueAtIndex(rt, i);

        if (!node.isObject() || !node.asObject(rt).hasNativeState<ShadowNodeWrapper>(rt)) {
            continue;
        }

        auto wrapper = node.asObject(rt).getNativeState<ShadowNodeWrapper>(rt);

        // never committed, React cloned it in a render that isn't committed yet (eg. a transition that yielded)
        // it holds what React rendered since, pointing it at the committed node would drop that
        if (!wrapper->shadowNode->getHasBeenPromoted()) {
            continue;
        }

        const auto& family = wrapper->shadowNode->getFamily();
        auto rootIt = roots.find(family.getSurfaceId());

        if (rootIt == roots.end()) {
            continue;
        }

        auto ancestors = family.getAncestors(*rootIt->second);

        // frozen nodes are not in the committed tree, nativeProps_DEPRECATED covers them
        if (ancestors.empty()) {
            continue;
        }

        const auto& [parent, index] = ancestors.back();

        wrapper->shadowNode = parent.get().getChildren().at(index);
    }

    return jsi::Value::undefined();
}

std::shared_ptr<const core::ShadowNode> HybridShadowRegistry::getShadowNodeFromRef(jsi::Runtime& rt, const jsi::Value& maybeRef) {
    return Bridging<std::shared_ptr<const ShadowNode>>::fromJs(rt, maybeRef);
}
