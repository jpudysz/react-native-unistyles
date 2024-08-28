#pragma once

#include <jsi/jsi.h>
#include "Unistyle.h"

namespace margelo::nitro::unistyles::parser {

using namespace facebook;

struct Parser {
    static Parser& get();
    
    Parser(const Parser&) = delete;
    Parser(const Parser&&) = delete;
    
    jsi::Object parseUnistyles(jsi::Runtime& rt, std::unordered_map<std::string, core::Unistyle>& unistyles);
    
private:
    Parser() = default;
};

Parser& Parser::get() {
    static Parser parser;
    
    return parser;
}

}
