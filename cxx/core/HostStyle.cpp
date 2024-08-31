#include "HostStyle.h"

using namespace margelo::nitro::unistyles::core;
using namespace facebook;

std::vector<jsi::PropNameID> HostStyle::getPropertyNames(jsi::Runtime& rt) {
    auto propertyNames = std::vector<jsi::PropNameID> {};
    
    helpers::enumerateJSIObject(rt, parsedStyleSheet, [&](const std::string propertyName, jsi::Value& propertyValue){
        propertyNames.emplace_back(jsi::PropNameID::forUtf8(rt, propertyName));
    });

    return propertyNames;
}

jsi::Value HostStyle::get(jsi::Runtime& rt, const jsi::PropNameID& propNameId) {
    auto propertyName = propNameId.utf8(rt);
    auto hasProperty = this->parsedStyleSheet.hasProperty(rt, propertyName.c_str());

    if (propertyName == helpers::ADD_VARIANTS_FN) {
        return jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forUtf8(rt, helpers::ADD_VARIANTS_FN), 1, [&](jsi::Runtime &rt, const jsi::Value &thisVal, const jsi::Value *arguments, size_t count){
            // proxy call
            auto originalFn = this->parsedStyleSheet.getProperty(rt, helpers::ADD_VARIANTS_FN.c_str()).asObject(rt).asFunction(rt);
            auto stylesWithVariants = originalFn.call(rt, arguments, count).asObject(rt);
            
            helpers::enumerateJSIObject(rt, stylesWithVariants, [&](const std::string propertyName, jsi::Value& propertyValue){
                // override property
                this->parsedStyleSheet.setProperty(rt, propertyName.c_str(), propertyValue.asObject(rt));
            });
            
            return jsi::Value::undefined();
        });
    }

    if (hasProperty) {
        return this->parsedStyleSheet.getProperty(rt, propertyName.c_str());
    }

    return jsi::Value(rt, parsedStyleSheet);
}

void HostStyle::set(jsi::Runtime& rt, const jsi::PropNameID& propNameId, const jsi::Value& value) {}
