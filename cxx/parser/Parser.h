#pragma once

#include <jsi/jsi.h>
#include <jsi/JSIDynamic.h>
#include <folly/dynamic.h>
#include "Unistyle.h"
#include "Dimensions.hpp"
#include "Constants.h"
#include "Helpers.h"
#include "MediaQueries.h"

namespace margelo::nitro::unistyles::parser {

using namespace facebook;
using Variants = std::vector<std::pair<std::string, std::string>>;

struct ParserSettings {
    const Variants& variants;
    const std::optional<std::string> currentBreakpointName;
    const std::vector<std::pair<std::string, double>>& sortedBreakpointPairs;
    const Dimensions screenDimensions;
};

struct Parser {
    static Parser& get();
    
    Parser(const Parser&) = delete;
    Parser(const Parser&&) = delete;
    
    jsi::Object parseUnistyles(jsi::Runtime& rt, std::vector<core::Unistyle>& unistyles, ParserSettings& settings);
    
private:
    Parser() = default;
    
    jsi::Object parseFirstLevel(jsi::Runtime &rt, core::Unistyle& unistyle, ParserSettings& settings);
    jsi::Value parseSecondLevel(jsi::Runtime &rt, jsi::Value& nestedObject, ParserSettings& setting);
    jsi::Function createDynamicFunctionProxy(jsi::Runtime &rt, core::Unistyle& unistyle, ParserSettings& settings);
    std::vector<folly::dynamic> parseDynamicFunctionArguments(jsi::Runtime& rt, size_t count, const jsi::Value* arguments);
    std::vector<core::UnistyleDependency> parseDependencies(jsi::Runtime& rt, jsi::Object&& dependencies);
    jsi::Value parseTransforms(jsi::Runtime& rt, jsi::Object& obj, ParserSettings& setting);
    jsi::Value getValueFromBreakpoints(jsi::Runtime& rt, jsi::Object& obj, ParserSettings& settings);
    jsi::Object parseVariants(jsi::Runtime& rt, jsi::Object& obj, ParserSettings& settings);
    jsi::Value getStylesForVariant(jsi::Runtime& rt, jsi::Object& groupValue, std::optional<std::string> selectedVariant);
    jsi::Object parseCompoundVariants(jsi::Runtime& rt, jsi::Object& obj, ParserSettings& settings);
    bool shouldApplyCompoundVariants(jsi::Runtime& rt, const Variants& variants, jsi::Object& compoundVariant);
};

Parser& Parser::get() {
    static Parser parser;
    
    return parser;
}

}
