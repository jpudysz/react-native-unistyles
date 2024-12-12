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

struct Parser {
    Parser(std::shared_ptr<HybridUnistylesRuntime> unistylesRuntime): _unistylesRuntime{unistylesRuntime} {}

    void buildUnistyles(jsi::Runtime& rt, std::shared_ptr<StyleSheet> styleSheet);
    void parseUnistyles(jsi::Runtime& rt, std::shared_ptr<StyleSheet> styleSheet);
    void rebuildUnistyleWithVariants(jsi::Runtime& rt, std::shared_ptr<core::UnistyleData> unistyleData);
    void rebuildUnistylesInDependencyMap(jsi::Runtime& rt, core::DependencyMap& dependencyMap, std::vector<std::shared_ptr<core::StyleSheet>>& styleSheets, std::optional<UnistylesNativeMiniRuntime> maybeMiniRuntime);
    void rebuildShadowLeafUpdates(jsi::Runtime& rt, core::DependencyMap& dependencyMap);
    folly::dynamic parseStylesToShadowTreeStyles(jsi::Runtime& rt, const std::vector<std::shared_ptr<UnistyleData>>& unistyles);
    void rebuildUnistyle(jsi::Runtime& rt, std::shared_ptr<StyleSheet> styleSheet, Unistyle::Shared unistyle, const Variants& variants, std::optional<std::vector<folly::dynamic>>);
    void rebuildUnistyleWithScopedTheme(jsi::Runtime& rt, jsi::Value& jsScopedTheme, std::shared_ptr<core::UnistyleData> unistyleData);
    jsi::Value getParsedStyleSheetForScopedTheme(jsi::Runtime& rt, core::Unistyle::Shared unistyle, std::string& scopedTheme);

private:
    jsi::Object unwrapStyleSheet(jsi::Runtime& rt, std::shared_ptr<StyleSheet> styleSheet, std::optional<UnistylesNativeMiniRuntime>);
    jsi::Object parseFirstLevel(jsi::Runtime& rt, Unistyle::Shared unistyle, std::optional<Variants> variants);
    jsi::Value parseSecondLevel(jsi::Runtime& rt, Unistyle::Shared unistyle, jsi::Value& nestedObject);
    jsi::Function createDynamicFunctionProxy(jsi::Runtime& rt, Unistyle::Shared unistyle);
    std::vector<UnistyleDependency> parseDependencies(jsi::Runtime &rt, jsi::Object&& dependencies);
    jsi::Value parseTransforms(jsi::Runtime& rt, Unistyle::Shared unistyle, jsi::Object& obj);
    jsi::Value parseBoxShadow(jsi::Runtime& rt, Unistyle::Shared unistyle, jsi::Object& obj);
    jsi::Value parseFilters(jsi::Runtime& rt, Unistyle::Shared unistyle, jsi::Object& obj);
    jsi::Value getValueFromBreakpoints(jsi::Runtime& rt, Unistyle::Shared unistyle, jsi::Object& obj);
    jsi::Object parseVariants(jsi::Runtime& rt, Unistyle::Shared unistyle, jsi::Object& obj, Variants& variants);
    jsi::Value getStylesForVariant(jsi::Runtime& rt, const std::string groupName, jsi::Object&& groupValue, std::optional<std::string> selectedVariant, Variants& variants);
    jsi::Object parseCompoundVariants(jsi::Runtime& rt, Unistyle::Shared unistyle, jsi::Object& obj, Variants& variants);
    bool shouldApplyCompoundVariants(jsi::Runtime& rt, const Variants& variants, jsi::Object& compoundVariant);
    bool isColor(const std::string& propertyName);

    std::shared_ptr<HybridUnistylesRuntime> _unistylesRuntime;
};

}
