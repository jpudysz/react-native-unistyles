#pragma once

#include <jsi/jsi.h>
#include <folly/dynamic.h>
#include "Unistyle.h"
#include "Dimensions.hpp"
#include "Constants.h"
#include "Helpers.h"
#include "MediaQueries.h"
#include "HybridUnistylesRuntime.h"
#include "StyleSheet.h"
#include "ShadowLeafUpdate.h"

namespace margelo::nitro::unistyles::parser {

using namespace facebook;
using namespace margelo::nitro::unistyles::core;

using Variants = std::vector<std::pair<std::string, std::string>>;
using DependencyMap = std::unordered_map<
    std::shared_ptr<core::StyleSheet>,
    std::unordered_map<const ShadowNodeFamily*, std::vector<core::Unistyle::Shared>>
>;

struct Parser {
    Parser(std::shared_ptr<HybridUnistylesRuntime> unistylesRuntime): _unistylesRuntime{unistylesRuntime} {}

    void buildUnistyles(jsi::Runtime& rt, std::shared_ptr<StyleSheet> styleSheet);
    void parseUnistyles(jsi::Runtime& rt, std::shared_ptr<StyleSheet> styleSheet);
    Variants variantsToPairs(jsi::Runtime& rt, jsi::Object&& variants);
    void rebuildUnistylesWithVariants(jsi::Runtime& rt, std::shared_ptr<StyleSheet> styleSheet);
    void rebuildUnistylesInDependencyMap(jsi::Runtime& rt, DependencyMap& dependencyMap);
    shadow::ShadowLeafUpdates dependencyMapToShadowLeafUpdates(DependencyMap& dependencyMap);

private:
    void rebuildUnistyle(jsi::Runtime& rt, std::shared_ptr<StyleSheet> styleSheet, Unistyle::Shared unistyle);
    jsi::Object unwrapStyleSheet(jsi::Runtime& rt, std::shared_ptr<StyleSheet> styleSheet);
    jsi::Object parseFirstLevel(jsi::Runtime& rt, Unistyle::Shared unistyle, Variants& variants);
    jsi::Value parseSecondLevel(jsi::Runtime& rt, jsi::Value& nestedObject);
    jsi::Function createDynamicFunctionProxy(jsi::Runtime& rt, Unistyle::Shared unistyle, Variants& variants);
    std::vector<folly::dynamic> parseDynamicFunctionArguments(jsi::Runtime& rt, size_t count, const jsi::Value* arguments);
    std::vector<UnistyleDependency> parseDependencies(jsi::Runtime &rt, jsi::Object&& dependencies);
    jsi::Value parseTransforms(jsi::Runtime& rt, jsi::Object& obj);
    jsi::Value getValueFromBreakpoints(jsi::Runtime& rt, jsi::Object& obj);
    jsi::Object parseVariants(jsi::Runtime& rt, jsi::Object& obj, Variants& variants);
    jsi::Value getStylesForVariant(jsi::Runtime& rt, jsi::Object&& groupValue, std::optional<std::string> selectedVariant);
    jsi::Object parseCompoundVariants(jsi::Runtime& rt, jsi::Object& obj, Variants& variants);
    bool shouldApplyCompoundVariants(jsi::Runtime& rt, const Variants& variants, jsi::Object& compoundVariant);
    RawProps parseStylesToShadowTreeStyles(jsi::Runtime& rt, jsi::Object& parsedStyles);
    bool isColor(const std::string& propertyName);

    std::shared_ptr<HybridUnistylesRuntime> _unistylesRuntime;
};

}
