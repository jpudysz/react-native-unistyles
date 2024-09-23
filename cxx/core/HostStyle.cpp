#include "HostStyle.h"

using namespace margelo::nitro::unistyles::core;
using namespace facebook;

std::vector<jsi::PropNameID> HostStyle::getPropertyNames(jsi::Runtime& rt) {
    auto propertyNames = std::vector<jsi::PropNameID> {};
    
    std::for_each(this->styleSheet->unistyles.begin(), this->styleSheet->unistyles.end(), [&](Unistyle::Shared unistyle){
        propertyNames.emplace_back(jsi::PropNameID::forUtf8(rt, unistyle->styleKey));
    });
    
    return propertyNames;
}

jsi::Value HostStyle::get(jsi::Runtime& rt, const jsi::PropNameID& propNameId) {
    auto propertyName = propNameId.utf8(rt);
    
    if (propertyName == helpers::UNISTYLES_ID) {
        return jsi::Value(this->styleSheet->tag);
    }
    
    if (propertyName == helpers::ADD_VARIANTS_FN) {
        auto addVariantsFnName = jsi::PropNameID::forUtf8(rt, helpers::ADD_VARIANTS_FN);

        return jsi::Function::createFromHostFunction(rt, addVariantsFnName, 1, [&](jsi::Runtime &rt, const jsi::Value &thisVal, const jsi::Value *arguments, size_t count){
            // todo
            
            return jsi::Value::undefined();
        });
    }

    auto it = std::find_if(this->styleSheet->unistyles.begin(), this->styleSheet->unistyles.end(), [&](Unistyle::Shared unistyle){
        return unistyle->styleKey == propertyName;
    });
    
    if (it == this->styleSheet->unistyles.end()) {
        return jsi::Value::undefined();
    }

    return valueFromUnistyle(rt, *it);
}

void HostStyle::set(jsi::Runtime& rt, const jsi::PropNameID& propNameId, const jsi::Value& value) {}
