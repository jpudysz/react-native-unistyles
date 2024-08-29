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
    const Variants variants;
    const std::optional<std::string> currentBreakpointName;
    const std::vector<std::pair<std::string, double>> sortedBreakpointPairs;
    const Dimensions screenDimensions;
    
    ParserSettings(
        Variants& variants,
        std::optional<std::string> currentBreakpointName,
        std::vector<std::pair<std::string, double>> sortedBreakpointPairs,
        Dimensions screenDimensions
    ): variants{std::move(variants)},
       currentBreakpointName(std::move(currentBreakpointName)),
       sortedBreakpointPairs{std::move(sortedBreakpointPairs)},
       screenDimensions(std::move(screenDimensions)) {}
};

struct Parser {
    static Parser& configure(std::unique_ptr<ParserSettings>);
    
    Parser(const Parser&) = delete;
    Parser(const Parser&&) = delete;
    
    jsi::Object parseUnistyles(jsi::Runtime& rt, std::vector<core::Unistyle>& unistyles);
    
private:
    Parser() = default;
    std::unique_ptr<ParserSettings> settings;

    jsi::Object parseFirstLevel(jsi::Runtime &rt, core::Unistyle& unistyle);
    jsi::Value parseSecondLevel(jsi::Runtime &rt, jsi::Value& nestedObject);
    jsi::Function createDynamicFunctionProxy(jsi::Runtime &rt, core::Unistyle& unistyle);
    std::vector<folly::dynamic> parseDynamicFunctionArguments(jsi::Runtime& rt, size_t count, const jsi::Value* arguments);
    std::vector<core::UnistyleDependency> parseDependencies(jsi::Runtime& rt, jsi::Object&& dependencies);
    jsi::Value parseTransforms(jsi::Runtime& rt, jsi::Object& obj);
    jsi::Value getValueFromBreakpoints(jsi::Runtime& rt, jsi::Object& obj);
    jsi::Object parseVariants(jsi::Runtime& rt, jsi::Object& obj);
    jsi::Value getStylesForVariant(jsi::Runtime& rt, jsi::Object& groupValue, std::optional<std::string> selectedVariant);
    jsi::Object parseCompoundVariants(jsi::Runtime& rt, jsi::Object& obj);
    bool shouldApplyCompoundVariants(jsi::Runtime& rt, const Variants& variants, jsi::Object& compoundVariant);
};

Parser& Parser::configure(std::unique_ptr<ParserSettings> settings) {
    static Parser parser;
    
    parser.settings = std::move(settings);

    return parser;
}

}
