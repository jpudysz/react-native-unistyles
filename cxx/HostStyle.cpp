#include "HostStyle.h"

HostStyle::HostStyle(jsi::Object& parsedStyleSheet): parsedStyleSheet{std::move(parsedStyleSheet)} {};

std::vector<jsi::PropNameID> HostStyle::getPropertyNames(jsi::Runtime& rt) {
    auto propertyNames = std::vector<jsi::PropNameID> {};

    auto names = this->parsedStyleSheet.getPropertyNames(rt);
    auto count = names.size(rt);

    for (size_t i = 0; i < count; i++) {
        auto nameValue = names.getValueAtIndex(rt, i).asString(rt);

        propertyNames.push_back(jsi::PropNameID::forString(rt, nameValue));
    }

    return propertyNames;
}

jsi::Value HostStyle::get(jsi::Runtime& rt, const jsi::PropNameID& propNameId) {
    auto propertyName = propNameId.utf8(rt);
    auto hasProperty = this->parsedStyleSheet.hasProperty(rt, propertyName.c_str());

    if (propertyName == ADD_VARIANTS_FN) {
        return createHostFunction(rt, ADD_VARIANTS_FN, 1, [this](jsi::Runtime &rt, const jsi::Value &thisVal, const jsi::Value *arguments, size_t count){
            auto originalFn = this->parsedStyleSheet.getProperty(rt, ADD_VARIANTS_FN.c_str()).asObject(rt).asFunction(rt);
            auto stylesWithVariants = originalFn.call(rt, arguments, count).asObject(rt);

            jsi::Array propertyNames = stylesWithVariants.getPropertyNames(rt);
            size_t length = propertyNames.size(rt);

            for (size_t i = 0; i < length; i++) {
                auto propertyName = propertyNames.getValueAtIndex(rt, i).asString(rt).utf8(rt);
                auto propertyValue = stylesWithVariants.getProperty(rt, propertyName.c_str()).asObject(rt);
                auto targetProperty = this->parsedStyleSheet.getProperty(rt, propertyName.c_str()).asObject(rt);

                mergeJSIObjects(rt, targetProperty, propertyValue);
            }

            return jsi::Value::undefined();
        });
    }

    if (hasProperty) {
        return this->parsedStyleSheet.getProperty(rt, propertyName.c_str());
    }

    return jsi::Value(rt, parsedStyleSheet);
}

void HostStyle::set(jsi::Runtime& rt, const jsi::PropNameID& propNameId, const jsi::Value& value) {}
