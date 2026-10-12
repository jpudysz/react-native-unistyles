#include "HybridShadowRegistry.h"

using namespace margelo::nitro::unistyles;
using namespace facebook::react;

jsi::Value HybridShadowRegistry::link(jsi::Runtime &rt, const jsi::Value &thisValue, const jsi::Value *args, size_t count) {
    helpers::assertThat(rt, count == 2, "Unistyles: Invalid babel transform 'ShadowRegistry link' expected 2 arguments.");

    // runtime was replaced, registry belongs to the next one
    if (!this->_unistylesRuntime->ownsRegistry()) {
        return jsi::Value::undefined();
    }

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
                auto secrets = getUnistyleSecrets(rt, rawStyleObj, unistyleWrappers[i]).value();
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
        auto secrets = getUnistyleSecrets(rt, rawStyleObj, unistyle);
        core::Variants variants{};

        if (secrets.has_value()) {
            auto rawVariants = secrets->getProperty(rt, helpers::STYLESHEET_VARIANTS.c_str());

            if (rawVariants.isObject()) {
                variants = helpers::variantsToPairs(rt, rawVariants.asObject(rt));
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
        // An object style without variants is the same for every view, so it's reused unless it's stale (dirty).
        if (!unistyleData->parsedStyle.has_value() && unistyle->parsedStyle.has_value()) {
            auto isSharedStyle = unistyle->type == core::UnistyleType::Object &&
                unistyle->styleKey != helpers::EXOTIC_STYLE_KEY &&
                !unistyle->isDirty &&
                !unistyle->rawValue.hasProperty(rt, "variants");

            if (isSharedStyle) {
                unistyleData->parsedStyle = jsi::Value(rt, unistyle->parsedStyle.value()).asObject(rt);
            } else {
                parser.rebuildUnistyleWithVariants(rt, unistyleData);
            }
        }

        unistylesData.emplace_back(unistyleData);
    }

    std::optional<folly::dynamic> initialScopedUpdate;
    bool shouldCommit = false;

    if (scopedTheme.has_value()) {
        initialScopedUpdate = parser.parseStylesToShadowTreeUpdates(rt, unistylesData);
        shouldCommit = shadow::hasNativeProps(&shadowNodeWrapper->getFamily());
    } else if (shadow::hasNativeProps(&shadowNodeWrapper->getFamily())) {
        auto update = parser.parseStylesToShadowTreeUpdates(rt, unistylesData);

        if (shadow::hasOutdatedNativeProps(&shadowNodeWrapper->getFamily(), update)) {
            initialScopedUpdate = std::move(update);
            shouldCommit = true;
        }
    }

    registry.linkShadowNodeWithUnistyle(
        rt,
        this->_unistylesRuntime->generation,
        shadowNodeWrapper->getFamilyShared(),
        unistylesData,
        std::move(initialScopedUpdate)
    );

    if (shouldCommit) {
        this->scheduleShadowTreeUpdate(rt);
    }

    return jsi::Value::undefined();
}

// a style made by Unistyles keeps its secrets (variants, arguments) under the unistyle's id,
// reading it directly spares enumerating (and converting to strings) every prop of every linked style
std::optional<jsi::Object> HybridShadowRegistry::getUnistyleSecrets(jsi::Runtime& rt, jsi::Object& style, const core::Unistyle::Shared& unistyle) {
    // inline and React Native styles have no secrets
    if (unistyle->styleKey == helpers::EXOTIC_STYLE_KEY) {
        return std::nullopt;
    }

    auto secrets = style.getProperty(rt, unistyle->unid.c_str());

    if (secrets.isObject()) {
        return secrets.asObject(rt);
    }

    auto unistyleHashKeys = core::getUnistylesHashKeys(rt, style);

    if (unistyleHashKeys.size() != 1) {
        return std::nullopt;
    }

    return style.getProperty(rt, unistyleHashKeys.at(0).c_str()).asObject(rt);
}

void HybridShadowRegistry::scheduleShadowTreeUpdate(jsi::Runtime& rt) {
    if (this->_isShadowTreeUpdateScheduled->exchange(true)) {
        return;
    }

    auto isShadowTreeUpdateScheduled = this->_isShadowTreeUpdateScheduled;
    auto unistylesRuntime = this->_unistylesRuntime;

    rt.queueMicrotask(jsi::Function::createFromHostFunction(
        rt,
        jsi::PropNameID::forAscii(rt, "unistylesUpdateShadowTree"),
        0,
        [isShadowTreeUpdateScheduled, unistylesRuntime](jsi::Runtime& rt, const jsi::Value&, const jsi::Value*, size_t) {
            isShadowTreeUpdateScheduled->store(false);

            // pending updates belong to the runtime that replaced this one
            if (!unistylesRuntime->ownsRegistry()) {
                return jsi::Value::undefined();
            }

            shadow::ShadowTreeManager::updateShadowTree(rt);

            return jsi::Value::undefined();
        }
    ));
}

jsi::Value HybridShadowRegistry::unlink(jsi::Runtime &rt, const jsi::Value &thisValue, const jsi::Value *args, size_t count) {
    helpers::assertThat(rt, count == 1, "Unistyles: Invalid babel transform 'ShadowRegistry unlink' expected 1 argument.");

    if (!this->_unistylesRuntime->ownsRegistry()) {
        return jsi::Value::undefined();
    }

    auto shadowNodeWrapper = getShadowNodeFromRef(rt, args[0]);

    auto& registry = core::UnistylesRegistry::get();

    registry.unlinkShadowNodeWithUnistyles(&shadowNodeWrapper->getFamily());

    return jsi::Value::undefined();
}

jsi::Value HybridShadowRegistry::suspend(jsi::Runtime &rt, const jsi::Value &thisValue, const jsi::Value *args, size_t count) {
    helpers::assertThat(rt, count == 1, "Unistyles: Invalid babel transform 'ShadowRegistry suspend' expected 1 argument.");

    if (!this->_unistylesRuntime->ownsRegistry()) {
        return jsi::Value::undefined();
    }

    auto shadowNodeWrapper = getShadowNodeFromRef(rt, args[0]);
    auto& registry = core::UnistylesRegistry::get();

    registry.suspendShadowNode(&shadowNodeWrapper->getFamily());

    return jsi::Value::undefined();
}

jsi::Value HybridShadowRegistry::flush(jsi::Runtime &rt, const jsi::Value &thisValue, const jsi::Value *args, size_t count) {
    if (!this->_unistylesRuntime->ownsRegistry()) {
        return jsi::Value::undefined();
    }

    shadow::ShadowTreeManager::updateShadowTree(rt);

    return jsi::Value::undefined();
}

jsi::Value HybridShadowRegistry::setScopedTheme(jsi::Runtime &rt, const jsi::Value &thisValue, const jsi::Value *args, size_t count) {
    helpers::assertThat(rt, count == 1, "Unistyles: setScopedTheme expected 1 argument.");

    if (!this->_unistylesRuntime->ownsRegistry()) {
        return jsi::Value::undefined();
    }

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

// the fibers React created the committed nodes with (weak, null once collected)
jsi::Value HybridShadowRegistry::takeCommittedInstanceHandles(jsi::Runtime &rt, const jsi::Value &thisValue, const jsi::Value *args, size_t count) {
    auto instanceHandles = core::UnistylesRegistry::get().takeCommittedInstanceHandles();
    auto result = jsi::Array(rt, instanceHandles.size());

    for (size_t i = 0; i < instanceHandles.size(); i++) {
        auto& instanceHandle = instanceHandles[i];

        result.setValueAtIndex(rt, i, instanceHandle ? instanceHandle->getInstanceHandle(rt) : jsi::Value::null());
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
