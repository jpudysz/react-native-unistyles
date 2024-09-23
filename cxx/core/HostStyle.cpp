#include "HostStyle.h"

using namespace margelo::nitro::unistyles::core;
using namespace margelo::nitro::unistyles::parser;
using namespace facebook;

std::vector<jsi::PropNameID> HostStyle::getPropertyNames(jsi::Runtime& rt) {
    auto propertyNames = std::vector<jsi::PropNameID> {};
    
    std::for_each(this->_styleSheet->unistyles.begin(), this->_styleSheet->unistyles.end(), [&](Unistyle::Shared unistyle){
        propertyNames.emplace_back(jsi::PropNameID::forUtf8(rt, unistyle->styleKey));
    });
    
    return propertyNames;
}

jsi::Value HostStyle::get(jsi::Runtime& rt, const jsi::PropNameID& propNameId) {
    auto propertyName = propNameId.utf8(rt);
    
    if (propertyName == helpers::UNISTYLES_ID) {
        return jsi::Value(this->_styleSheet->tag);
    }
    
    if (propertyName == helpers::ADD_VARIANTS_FN) {
        auto addVariantsFnName = jsi::PropNameID::forUtf8(rt, helpers::ADD_VARIANTS_FN);

        return jsi::Function::createFromHostFunction(rt, addVariantsFnName, 1, [&](jsi::Runtime &rt, const jsi::Value &thisVal, const jsi::Value *arguments, size_t count){
            helpers::assertThat(rt, count == 1, "addVariants expected to be called with one argument.");
            helpers::assertThat(rt, arguments[0].isObject(), "addVariants expected to be called with object.");
  
            auto parser = parser::Parser(this->_unistylesRuntime);
            auto pairs = parser.variantsToPairs(rt, arguments[0].asObject(rt));
            
            if (pairs == this->_styleSheet->variants) {
                return jsi::Value::undefined();
            }
            
            this->_styleSheet->variants = pairs;
            
            parser.rebuildUnistylesWithVariants(rt, this->_styleSheet);
            
            return jsi::Value::undefined();
        });
    }

    auto it = std::find_if(this->_styleSheet->unistyles.begin(), this->_styleSheet->unistyles.end(), [&](Unistyle::Shared unistyle){
        return unistyle->styleKey == propertyName;
    });
    
    if (it == this->_styleSheet->unistyles.end()) {
        return jsi::Value::undefined();
    }

    return valueFromUnistyle(rt, *it);
}

void HostStyle::set(jsi::Runtime& rt, const jsi::PropNameID& propNameId, const jsi::Value& value) {}
