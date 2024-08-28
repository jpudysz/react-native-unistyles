#pragma once

#include <jsi/jsi.h>
#include <jsi/JSIDynamic.h>
#include "Unistyle.h"
#include "Constants.h"
#include "Helpers.h"
#include <folly/dynamic.h>

namespace margelo::nitro::unistyles::parser {

using namespace facebook;

struct Parser {
    static Parser& get();
    
    Parser(const Parser&) = delete;
    Parser(const Parser&&) = delete;
    
    jsi::Object parseUnistyles(jsi::Runtime& rt, std::vector<core::Unistyle>& unistyles);
    
private:
    Parser() = default;
    
    jsi::Object parseFirstLevel(jsi::Runtime &rt, core::Unistyle& unistyle);
    jsi::Function createDynamicFunctionProxy(jsi::Runtime &rt, core::Unistyle& unistyle);
    std::vector<folly::dynamic> parseDynamicFunctionArguments(jsi::Runtime& rt, size_t count, const jsi::Value* arguments);
};

Parser& Parser::get() {
    static Parser parser;
    
    return parser;
}

}
