#pragma once

#include <jsi/jsi.h>
#include <jsi/JSIDynamic.h>
#include "Unistyle.h"
#include "Constants.h"
#include "Helpers.h"
#include <folly/dynamic.h>

namespace margelo::nitro::unistyles::parser {

using namespace facebook;
using Variants = std::vector<std::pair<std::string, std::string>>;

struct Parser {
    static Parser& get();
    
    Parser(const Parser&) = delete;
    Parser(const Parser&&) = delete;
    
    jsi::Object parseUnistyles(jsi::Runtime& rt, std::vector<core::Unistyle>& unistyles, Variants& variants);
    
private:
    Parser() = default;
    
    jsi::Object parseFirstLevel(jsi::Runtime &rt, core::Unistyle& unistyle, Variants& variants);
    jsi::Object parseSecondLevel(jsi::Runtime &rt, jsi::Value& nestedObject);
    jsi::Function createDynamicFunctionProxy(jsi::Runtime &rt, core::Unistyle& unistyle, Variants& variants);
    std::vector<folly::dynamic> parseDynamicFunctionArguments(jsi::Runtime& rt, size_t count, const jsi::Value* arguments);
    std::vector<core::UnistyleDependency> parseDependencies(jsi::Runtime& rt, jsi::Object&& dependencies);
    jsi::Value parseTransforms(jsi::Runtime& rt, jsi::Object& obj);
    jsi::Value getValueFromBreakpoints(jsi::Runtime& rt, jsi::Object& obj);
    jsi::Object parseVariants(jsi::Runtime& rt, Variants& variants, jsi::Object& obj);
    jsi::Value getStylesForVariant(jsi::Runtime& rt, jsi::Object& groupValue, std::optional<std::string> selectedVariant);
    jsi::Object parseCompoundVariants(jsi::Runtime& rt, Variants& variants, jsi::Object& obj);
    bool shouldApplyCompoundVariants(jsi::Runtime& rt, Variants& variants, jsi::Object& compoundVariant);
};

Parser& Parser::get() {
    static Parser parser;
    
    return parser;
}

}
