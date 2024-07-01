#include "StyleSheet.h"
#include <jsi/jsi.h>

using namespace facebook;

std::vector<jsi::PropNameID> StyleSheet::getPropertyNames(jsi::Runtime& rt) {
    std::vector<jsi::PropNameID> properties;
    std::for_each(this->getters.begin(), this->getters.end(), [&](const auto& it){
        properties.push_back(jsi::PropNameID::forUtf8(rt, std::string(it.first)));
    });

    std::for_each(this->setters.begin(), this->setters.end(), [&](const auto& it){
        properties.push_back(jsi::PropNameID::forUtf8(rt, std::string(it.first)));
    });

    return properties;
}

jsi::Value StyleSheet::get(jsi::Runtime& rt, const jsi::PropNameID& propNameId) {
    auto method = this->getters.find(propNameId.utf8(rt));

    if (method != this->getters.cend()) {
        return method->second(rt, method->first);
    }

    return jsi::Value::undefined();
}

void StyleSheet::set(jsi::Runtime& rt, const jsi::PropNameID& propNameId, const jsi::Value& value) {
    auto method = this->setters.find(propNameId.utf8(rt));

    if (method != this->setters.cend()) {
        method->second(rt, value);
    }
}
