#pragma once

#include <jsi/jsi.h>
#include "Helpers.h"
#include "Parser.h"
#include "UnistyleWrapper.h"

namespace margelo::nitro::unistyles::core {

jsi::Function createAddVariantsProxyFunction(jsi::Runtime& rt, std::shared_ptr<StyleSheet> stylesheet, std::shared_ptr<HybridUnistylesRuntime> unistylesRuntime) {
    auto useVariantsFnName = jsi::PropNameID::forUtf8(rt, helpers::ADD_VARIANTS_FN);
    auto parser = parser::Parser(unistylesRuntime);

    return jsi::Function::createFromHostFunction(rt, useVariantsFnName, 1, [stylesheet, unistylesRuntime, &parser](jsi::Runtime &rt, const jsi::Value &thisVal, const jsi::Value *arguments, size_t count){
        helpers::assertThat(rt, count == 1, "Unistyles: useVariants expected to be called with one argument.");
        helpers::assertThat(rt, arguments[0].isObject(), "Unistyles: useVariants expected to be called with object.");

        jsi::Object rnStyle = jsi::Object(rt);
        Variants variants = helpers::variantsToPairs(rt, arguments[0].asObject(rt));
        
        // copy hidden properties as they are not enumerable
        helpers::defineHiddenProperty(rt, rnStyle, helpers::STYLESHEET_ID.c_str(), jsi::Value(stylesheet->tag));
        helpers::defineHiddenProperty(rt, rnStyle, helpers::STYLESHEET_VARIANTS.c_str(), arguments[0].asObject(rt));

        // copy unaffected styles, or compute new
        helpers::enumerateJSIObject(rt, thisVal.asObject(rt), [&, stylesheet](const std::string& name, jsi::Value& value){
            if (name == helpers::ADD_VARIANTS_FN) {
                rnStyle.setProperty(rt, helpers::ADD_VARIANTS_FN.c_str(), std::move(value));
                
                return;
            }
            
            if (!stylesheet->unistyles.contains(name)) {
                return;
            }
            
            auto unistyle = stylesheet->unistyles[name];
            
            if (!unistyle->dependsOn(UnistyleDependency::VARIANTS)) {
                rnStyle.setProperty(rt, name.c_str(), std::move(value));
                
                return;
            }
            
            // compute new value
            parser.rebuildUnistyle(rt, stylesheet, unistyle, variants, std::nullopt);
            rnStyle.setProperty(rt, name.c_str(), valueFromUnistyle(rt, unistylesRuntime, unistyle, variants));
        });

        return rnStyle;
    });
}

jsi::Object toRNStyle(jsi::Runtime& rt, std::shared_ptr<StyleSheet> stylesheet, std::shared_ptr<HybridUnistylesRuntime> unistylesRuntime, Variants&& variants) {
    jsi::Object rnStyle = jsi::Object(rt);

    helpers::defineHiddenProperty(rt, rnStyle, helpers::STYLESHEET_ID.c_str(), jsi::Value(stylesheet->tag));
    helpers::defineHiddenProperty(rt, rnStyle, helpers::STYLESHEET_VARIANTS.c_str(), helpers::variantsToValue(rt, variants));
    rnStyle.setProperty(rt, helpers::ADD_VARIANTS_FN.c_str(), createAddVariantsProxyFunction(rt, stylesheet, unistylesRuntime));

    for (auto& pair: stylesheet->unistyles) {
        auto [propertyName, unistyle] = pair;

        rnStyle.setProperty(rt, propertyName.c_str(), valueFromUnistyle(rt, unistylesRuntime, unistyle, variants));
    }

    return rnStyle;
}

}
