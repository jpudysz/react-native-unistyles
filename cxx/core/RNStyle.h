#pragma once

#include <jsi/jsi.h>
#include "Helpers.h"
#include "UnistyleWrapper.h"

namespace margelo::nitro::unistyles::core {

jsi::Object toRNStyle(jsi::Runtime& rt, std::shared_ptr<StyleSheet> styleSheet, std::shared_ptr<HybridUnistylesRuntime> unistylesRuntime, Variants&& variants);

jsi::Function createAddVariantsProxyFunction(jsi::Runtime& rt, std::shared_ptr<StyleSheet> stylesheet, std::shared_ptr<HybridUnistylesRuntime> unistylesRuntime) {
    auto useVariantsFnName = jsi::PropNameID::forUtf8(rt, helpers::ADD_VARIANTS_FN);

    return jsi::Function::createFromHostFunction(rt, useVariantsFnName, 1, [stylesheet, unistylesRuntime](jsi::Runtime &rt, const jsi::Value &thisVal, const jsi::Value *arguments, size_t count){
        helpers::assertThat(rt, count == 1, "Unistyles: useVariants expected to be called with one argument.");
        helpers::assertThat(rt, arguments[0].isObject(), "Unistyles: useVariants expected to be called with object.");

        // using variants == cloning stylesheet
        return toRNStyle(rt, stylesheet, unistylesRuntime, helpers::variantsToPairs(rt, arguments[0].asObject(rt)));
    });
}

jsi::Object toRNStyle(jsi::Runtime& rt, std::shared_ptr<StyleSheet> stylesheet, std::shared_ptr<HybridUnistylesRuntime> unistylesRuntime, Variants&& variants) {
    jsi::Object rnStyle = jsi::Object(rt);
    
    helpers::defineHiddenProperty(rt, rnStyle, helpers::UNISTYLES_ID.c_str(), jsi::Value(stylesheet->tag));
    helpers::defineHiddenProperty(rt, rnStyle, helpers::STYLE_VARIANTS.c_str(), helpers::variantsToValue(rt, variants));
    
    rnStyle.setProperty(rt, helpers::ADD_VARIANTS_FN.c_str(), createAddVariantsProxyFunction(rt, stylesheet, unistylesRuntime));

    for (auto& pair: stylesheet->unistyles) {
        auto [propertyName, unistyle] = pair;

        rnStyle.setProperty(rt, propertyName.c_str(), valueFromUnistyle(rt, unistylesRuntime, unistyle, variants));
    }
    
    return rnStyle;
}

}
