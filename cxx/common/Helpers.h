#pragma once

#include <jsi/jsi.h>
#include <unordered_set>

using namespace facebook;

namespace margelo::nitro::unistyles::helpers {

inline void assertThat(jsi::Runtime& rt, bool condition, const std::string& message) {
    if (!condition) {
        throw jsi::JSError(rt, "[Unistyles]: " + message);
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

template <typename T>
inline bool vecPairsContainsKeys(std::vector<std::pair<std::string, T>>& vec, std::vector<std::string>&& keys) {
    std::unordered_set<std::string> availableKeys(keys.begin(), keys.end());
    
    for (const auto& pair : vec) {
        availableKeys.erase(pair.first);

        if (availableKeys.empty()) {
            return true;
        }
    }
    
    return false;
}

}

