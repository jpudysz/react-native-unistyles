#pragma once

#include <jsi/jsi.h>
#include <unordered_set>

using namespace facebook;

namespace margelo::nitro::unistyles::helpers {

inline void assertThat(jsi::Runtime& rt, bool condition, const std::string& message) {
    if (!condition) {
        throw jsi::JSError(rt, message);
    }
}

inline void enumerateJSIObject(jsi::Runtime& rt, const jsi::Object& obj, std::function<void(const std::string& propertyName, jsi::Value& propertyValue)> callback) {
    jsi::Array propertyNames = obj.getPropertyNames(rt);
    size_t length = propertyNames.size(rt);
    
    for (size_t i = 0; i < length; i++) {
        auto propertyName = propertyNames.getValueAtIndex(rt, i).asString(rt).utf8(rt);
        auto propertyValue = obj.getProperty(rt, propertyName.c_str());
        
        callback(propertyName, propertyValue);
    }
}

template<typename PropertyType>
inline bool vecContainsKeys(std::vector<PropertyType>& vec, std::vector<PropertyType>&& keys) {
    std::unordered_set<PropertyType> availableKeys(keys.begin(), keys.end());
    
    for (const auto& key : vec) {
        availableKeys.erase(key);
        
        if (availableKeys.empty()) {
            return true;
        }
    }
    
    return false;
}

}
