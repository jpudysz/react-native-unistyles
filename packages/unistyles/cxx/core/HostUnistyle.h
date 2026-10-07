#pragma once

#include <jsi/jsi.h>
#include "Parser.h"
#include "UnistyleWrapper.h"

namespace margelo::nitro::unistyles::core {

using Variants = std::vector<std::pair<std::string, std::string>>;

struct JSI_EXPORT HostUnistyle : public jsi::HostObject {
    HostUnistyle(jsi::Runtime& rt, std::shared_ptr<StyleSheet> stylesheet, std::shared_ptr<HybridUnistylesRuntime> unistylesRuntime, Variants& variants, bool ownsStyleSheet = false)
        : _runtime(&rt), _stylesheet(stylesheet), _unistylesRuntime{unistylesRuntime}, _variants{std::move(variants)}, _ownsStyleSheet(ownsStyleSheet) {};
    ~HostUnistyle();

    std::vector<jsi::PropNameID> getPropertyNames(jsi::Runtime& rt);
    jsi::Value get(jsi::Runtime& rt, const jsi::PropNameID& propNameId);
    void set(jsi::Runtime& rt, const jsi::PropNameID& propNameId, const jsi::Value& value);

    jsi::Function createAddVariantsProxyFunction(jsi::Runtime& rt);

private:
    bool isWorkletRuntime(jsi::Runtime& rt);

    // the runtime that created this stylesheet, cached styles and unistyles hold its values
    jsi::Runtime* _runtime;
    bool _ownsStyleSheet;
    Variants _variants;
    std::shared_ptr<StyleSheet> _stylesheet;
    std::shared_ptr<HybridUnistylesRuntime> _unistylesRuntime;
    std::unordered_map<std::string, jsi::Value> _cache;
};

}
