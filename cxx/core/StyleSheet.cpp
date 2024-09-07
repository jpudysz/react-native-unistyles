#include "StyleSheet.h"

using namespace margelo::nitro::unistyles;
using namespace facebook;

void core::StyleSheet::addVariants(jsi::Runtime &rt, jsi::Value&& variants) {
    if (variants.isUndefined()) {
        return;
    }

    helpers::assertThat(rt, variants.isObject(), "add variants expected to be called with object.");

    auto selectedVariants = variants.asObject(rt);

    helpers::enumerateJSIObject(rt, selectedVariants, [&](const std::string& variantName, jsi::Value& variantValue){
        if (variantValue.isUndefined() || variantValue.isNull()) {
            return;
        }

        if (variantValue.isBool()) {
            this->addOrUpdateVariant(variantName, variantValue.asBool() ? "true" : "false");
            
            return;
        }

        if (variantValue.isString()) {
            this->addOrUpdateVariant(variantName, variantValue.asString(rt).utf8(rt));
        }
    });
}

void core::StyleSheet::addOrUpdateVariant(std::string variantName, std::string variantValue) {
    auto it = std::find_if(this->variants.begin(), this->variants.end(),
        [&variantName](const auto& pair) {
            return pair.first == variantName;
        });
    
    // new entry
    if (it == this->variants.end()) {
        this->variants.emplace_back(std::make_pair(variantName, variantValue));
        
        return;
    }
    
    // update
    it->second = variantValue;
}
