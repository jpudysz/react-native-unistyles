#pragma once

#include <jsi/jsi.h>
#include "StyleSheet.h"
#include "Constants.h"
#include "Parser.h"
#include "HybridUnistylesRuntime.h"

namespace margelo::nitro::unistyles::core {

using Variants = std::vector<std::pair<std::string, std::string>>;

struct JSI_EXPORT HostStyle : public jsi::HostObject {
    HostStyle(std::shared_ptr<StyleSheet> styleSheet, std::shared_ptr<HybridUnistylesRuntime> unistylesRuntime)
        : _styleSheet{styleSheet}, _unistylesRuntime{unistylesRuntime} {};

    std::vector<jsi::PropNameID> getPropertyNames(jsi::Runtime& rt);
    jsi::Value get(jsi::Runtime& rt, const jsi::PropNameID& propNameId);
    void set(jsi::Runtime& rt, const jsi::PropNameID& propNameId, const jsi::Value& value);
    jsi::Function createAddVariantsProxyFunction(jsi::Runtime& rt);

private:
    std::shared_ptr<StyleSheet> _styleSheet;
    std::shared_ptr<HybridUnistylesRuntime> _unistylesRuntime;
    std::vector<std::pair<std::string, std::string>> _variants{};
    
};

}
